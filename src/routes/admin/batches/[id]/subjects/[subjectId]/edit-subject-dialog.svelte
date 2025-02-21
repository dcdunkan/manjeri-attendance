<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
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
		.min(3, "Name is too short")
		.max(128, "Name is too long");

	let message = $derived.by(() => {
		const data = validName.safeParse(subjectNameInput);
		return data.success
			? undefined
			: data.error.isEmpty
				? "Invalid input"
				: data.error.issues[0].message;
	});

	async function updateName() {
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
			toast.error("Failed to update subject name.");
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
			<Dialog.Title>Edit subject name</Dialog.Title>
			<Dialog.Description>{subject.name}</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-2">
			<Input
				type="text"
				required
				placeholder={`Name for "${subject.name}"`}
				bind:value={subjectNameInput}
				onkeypress={async (e) => {
					if (e.key === "Enter") await updateName();
				}}
			/>
			{#if message}
				<div transition:slide|global class="text-sm text-error-foreground">{message}</div>
			{/if}
		</div>

		<Dialog.Footer class="gap-y-2">
			<Button variant="secondary" onclick={() => (open = false)}>Close</Button>
			<Button
				disabled={isUpdating || !validName.safeParse(subjectNameInput).success}
				onclick={updateName}
			>
				{#if isUpdating}
					<LoaderCircleIcon class="animate-spin" /> Updating...
				{:else}
					Update name
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
