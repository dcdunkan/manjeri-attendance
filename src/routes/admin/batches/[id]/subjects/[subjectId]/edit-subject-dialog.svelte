<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import type { getSubject } from "$lib/server/db/subjects";
	import type { Result, Payload } from "$lib/types";
	import { LoaderCircleIcon } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { slide } from "svelte/transition";
	import { z } from "zod";

	let {
		open = $bindable(false),
		subject = $bindable(),
	}: {
		open: boolean;
		subject: Awaited<ReturnType<typeof getSubject>>;
	} = $props();

	let subjectNameInput = $state(subject.name);
	let isUpdating = $state(false);

	const validName = z
		.string({
			invalid_type_error: "Invalid name input",
			required_error: "A name is required",
		})
		.trim()
		.min(3, "Name is too short")
		.max(128, "Name is too long")
		.refine((str) => str !== subject.name, {
			message: "New subject name can't be the same!",
		});

	let parsedInput = $derived.by(() => validName.safeParse(subjectNameInput));

	let message = $derived(
		parsedInput.success
			? undefined
			: parsedInput.error.isEmpty
				? "Invalid input"
				: parsedInput.error.issues[0].message,
	);

	async function changeSubjectName() {
		isUpdating = true;

		const parsed = validName.safeParse(subjectNameInput);
		if (!parsed.success) return toast.error("Invalid name!");

		const response = await fetch("/api/admin/subjects/update-name", {
			method: "PATCH",
			body: JSON.stringify({
				subjectId: subject.id,
				batchId: subject.batch.id,
				name: parsed.data,
			} satisfies Payload.UpdateSubjectName),
			headers: { "Content-Type": "application/json" },
		});
		if (!response.ok && response.status !== 400) {
			isUpdating = false;
			toast.error("Failed to update subject name.");
			return;
		}
		const result: Result = await response.json();
		if (!result.ok) {
			isUpdating = false;
			toast.error(result.reason);
			return;
		}

		isUpdating = false;
		open = false;
		subject.name = parsed.data;
		toast.success("Subject name was changed");
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit subject</Dialog.Title>
			<Dialog.Description>{subject.name}</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-2">
			<Label for="name">Subject name</Label>
			<Input
				id="name"
				type="text"
				required
				placeholder={`Name for "${subject.name}"`}
				bind:value={subjectNameInput}
				onkeypress={async (e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						await changeSubjectName();
					}
				}}
			/>
			{#if message}
				<div transition:slide class="text-sm text-error-foreground">{message}</div>
			{/if}
		</div>

		<Dialog.Footer class="gap-y-2">
			<Button variant="secondary" onclick={() => (open = false)}>Close</Button>
			<Button disabled={isUpdating || !parsedInput.success} onclick={changeSubjectName}>
				{#if isUpdating}
					<LoaderCircleIcon class="animate-spin" /> Changing...
				{:else}
					Change name
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
