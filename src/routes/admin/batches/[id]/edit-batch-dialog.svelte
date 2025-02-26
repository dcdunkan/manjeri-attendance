<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import type { getBatchWithSubjects } from "$lib/server/db/batches";
	import type { getSubject } from "$lib/server/db/subjects";
	import type { Result, Payload } from "$lib/types";
	import { LoaderCircleIcon } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { slide } from "svelte/transition";
	import { z } from "zod";

	let {
		open = $bindable(false),
		batch = $bindable(),
	}: {
		open: boolean;
		batch: NonNullable<Awaited<ReturnType<typeof getBatchWithSubjects>>>;
	} = $props();

	let batchNameInput = $state(batch.name);
	let isUpdating = $state(false);

	const validName = z
		.string({
			invalid_type_error: "Invalid name input",
			required_error: "A name is required",
		})
		.trim()
		.nonempty("A name is required")
		.min(3, "Name is too short")
		.max(32, "Name is too long")
		.refine((str) => str !== batch.name, {
			message: "New batch name can't be the same!",
		});

	let parsedInput = $derived.by(() => validName.safeParse(batchNameInput));

	let message = $derived(
		parsedInput.success
			? undefined
			: parsedInput.error.isEmpty
				? "Invalid input"
				: parsedInput.error.issues[0].message,
	);

	async function changeBatchName() {
		isUpdating = true;

		const parsed = validName.safeParse(batchNameInput);
		if (!parsed.success) return toast.error("Invalid name!");

		const response = await fetch("/api/admin/batch/name", {
			method: "PATCH",
			body: JSON.stringify({
				batchId: batch.id,
				name: parsed.data,
			} satisfies Payload.UpdateBatchName),
			headers: { "Content-Type": "application/json" },
		});
		if (!response.ok && response.status !== 400) {
			isUpdating = false;
			toast.error("Failed to update batch name.");
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
		batch.name = parsed.data;
		toast.success("Batch name was changed");
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit batch name</Dialog.Title>
			<Dialog.Description>{batch.name}</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-2">
			<Label for="name">Batch name</Label>
			<Input
				id="name"
				type="text"
				required
				placeholder={`New name for "${batch.name}"`}
				bind:value={batchNameInput}
				onkeypress={async (e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						await changeBatchName();
					}
				}}
			/>
			{#if message}
				<div transition:slide class="text-sm text-error-foreground">{message}</div>
			{/if}
		</div>

		<Dialog.Footer class="gap-y-2">
			<Button variant="secondary" onclick={() => (open = false)}>Close</Button>
			<Button disabled={isUpdating || !parsedInput.success} onclick={changeBatchName}>
				{#if isUpdating}
					<LoaderCircleIcon class="animate-spin" /> Changing...
				{:else}
					Change name
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
