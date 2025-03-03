<script lang="ts">
	import {
		ArrowRightIcon,
		BookUserIcon,
		LoaderCircleIcon,
		PlusIcon,
		Trash2Icon,
		UserPlusIcon,
	} from "lucide-svelte";
	import type { PageData } from "./$types";
	import { Button } from "$lib/components/ui/button";
	import EmptyInfobox from "$lib/components/empty-infobox.svelte";
	import type { LoadedData, Payload, Result } from "$lib/types";
	import { onMount } from "svelte";
	import LoadingCard from "$lib/components/loading-card.svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";
	import DeleteBatchDialog from "./delete-batch-dialog.svelte";
	import { Input } from "$lib/components/ui/input";
	import { toast } from "svelte-sonner";
	import { z } from "zod";
	import { slide } from "svelte/transition";

	let { data }: { data: PageData } = $props();

	let batch = $state<LoadedData<Awaited<typeof data.batch>>>({
		state: "pending",
		message: "Loading batch details...",
	});

	onMount(async () => {
		try {
			batch = { state: "resolved", data: await data.batch };
		} catch (err) {
			console.error(err);
			batch = { state: "failed", message: "Failed to load batch details." };
		}
	});

	let showDeleteBatchDialog = $state(false);

	let subjectInput = $state("");
	let subjectInputElement = $state<HTMLInputElement | null>(null);
	let isAddingSubject = $state(false);
	let showSubjectInputErrors = $state(false);
	const subjectInputSchema = $derived.by(() => {
		if (batch.state !== "resolved" || batch.data == null) return;
		const registeredSubjects = batch.data.subjects.map((subject) => subject.name.toLowerCase());
		return z
			.string({
				invalid_type_error: "Subject name is invalid",
				required_error: "Subject name is required",
			})
			.trim()
			.min(3, "Subject name is too short")
			.max(32, "Subject name is too long")
			.refine((subject) => !registeredSubjects.includes(subject.toLowerCase()), {
				message: "Subject is already registered",
			});
	});
	let subjectInputError = $derived.by(() => {
		const parsed = subjectInputSchema?.safeParse(subjectInput);
		if (parsed?.success) return;
		return parsed?.error.issues[0]?.message || "Invalid inputs";
	});

	async function addBatchSubject() {
		if (batch.state !== "resolved" || batch.data == null) return;
		if (isAddingSubject || subjectInputSchema == null) return;

		const parsed = subjectInputSchema.safeParse(subjectInput);
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "Invalid inputs");
			return;
		}

		isAddingSubject = true;
		const response = await fetch("/api/admin/batch/subject", {
			method: "POST",
			body: JSON.stringify({
				batchId: batch.data.id,
				name: parsed.data,
			} satisfies Payload.AddBatchSubject),
			headers: { "Content-Type": "application/json" },
		});
		if (!response.ok && response.status !== 400) {
			isAddingSubject = false;
			toast.error("Failed to update batch name.");
			return;
		}
		const result: Result<{ id: number }> = await response.json();
		if (!result.ok) {
			isAddingSubject = false;
			toast.error(result.reason);
			return;
		}

		subjectInput = "";
		batch.data.subjects.push({
			id: result.data.id,
			name: parsed.data,
			batchId: batch.data.id,
		});
		isAddingSubject = false;
		toast.success("Done!", { duration: 200 });
		showSubjectInputErrors = false;
	}

	type Subject = NonNullable<Awaited<(typeof data)["batch"]>>["subjects"][number];
	function comparatorFn(a: Subject, b: Subject) {
		return a.name.localeCompare(b.name);
	}
</script>

{#if batch.state === "pending"}
	<LoadingCard>{batch.message}</LoadingCard>
{:else if batch.state === "resolved"}
	{#if batch.data == null}
		<LoadingFailedCard>Batch not found.</LoadingFailedCard>
	{:else}
		<div class="flex place-items-center justify-between">
			<h1 class="flex place-items-baseline gap-2 text-2xl">
				Batch {batch.data.name}
			</h1>
			<Button variant="destructive" onclick={() => (showDeleteBatchDialog = true)}>
				<Trash2Icon />
			</Button>
		</div>

		<!-- <EditBatchDialog bind:open={showEditBatchNameDialog} bind:batch={batch.data} /> -->
		<DeleteBatchDialog bind:open={showDeleteBatchDialog} batch={batch.data} />

		<div class="flex place-items-center justify-center gap-10 rounded-lg border p-6">
			<div class="text-right">
				<div class="text-5xl">{batch.data.studentCount}</div>
				<div class="text-xl">students</div>
			</div>
			<div>|</div>
			<div class="text-left">
				<div class="text-5xl">{batch.data.subjects.length}</div>
				<div class="text-xl">subjects</div>
			</div>
		</div>

		<div class="space-y-4">
			<h2 class="text-xl">Students</h2>

			<div class="space-y-2">
				<a
					href="{batch.data.id}/students/new"
					class="flex w-full cursor-pointer place-items-center gap-2 rounded py-3"
				>
					<UserPlusIcon class="ml-2 size-6" />
					<div class="ml-6 flex-grow">Register new batch student</div>
					<ArrowRightIcon />
				</a>

				<a
					href="{batch.data.id}/students"
					class="flex w-full cursor-pointer place-items-center gap-2 rounded py-3"
				>
					<BookUserIcon class="ml-2 size-6" />
					<div class="ml-6 flex-grow">See all registered students</div>
					<ArrowRightIcon />
				</a>
			</div>
		</div>

		<div class="space-y-4">
			<h2 class="text-xl">Subjects</h2>

			<p>Select a subject to see students enrolled, attendance statistics and manage statistics.</p>

			<div class="space-y-2">
				{#each batch.data.subjects.toSorted(comparatorFn) as subject, i}
					<a
						class="flex w-full cursor-pointer place-items-center gap-2 rounded py-3"
						href="{subject.batchId}/subjects/{subject.id}"
					>
						<div class="ml-2 text-right font-mono">
							{(i + 1).toString().padStart(batch.data.subjects.length.toString().length, "0")}&rpar;
						</div>
						<div class="ml-6 flex-grow">{subject.name}</div>
						<div><ArrowRightIcon /></div>
					</a>
				{:else}
					<EmptyInfobox>
						<p>No subjects have been added to the batch.</p>
					</EmptyInfobox>
				{/each}
			</div>

			<div class="space-y-2">
				<div class="flex gap-2">
					<Input
						bind:ref={subjectInputElement}
						type="text"
						placeholder="Subject name to add"
						bind:value={subjectInput}
						onkeypress={async (event) => {
							showSubjectInputErrors = true;
							if (event.key === "Enter") {
								event.preventDefault();
								await addBatchSubject();
							}
						}}
					/>
					<Button
						onclick={addBatchSubject}
						variant="secondary"
						disabled={subjectInputSchema == null ||
							!subjectInputSchema.safeParse(subjectInput).success ||
							isAddingSubject}
					>
						{#if isAddingSubject}
							<LoaderCircleIcon class="animate-spin" /> Adding...
						{:else}
							<PlusIcon /> Add subject
						{/if}
					</Button>
				</div>

				{#if showSubjectInputErrors && subjectInputError != null}
					<div transition:slide class="text-sm text-error-foreground">
						{subjectInputError}
					</div>
				{/if}
			</div>
		</div>
	{/if}
{:else if batch.state === "failed"}
	<LoadingFailedCard>{batch.message}</LoadingFailedCard>
{:else}
	<LoadingFailedCard>Unknown action.</LoadingFailedCard>
{/if}
