<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import type { getBatchWithSubjects } from "$lib/server/db/batches";
	import type { AwaitReturn, Result } from "$lib/types";
	import { ClockIcon, LoaderCircleIcon, Trash2Icon } from "lucide-svelte";
	import { toast } from "svelte-sonner";

	let {
		open = $bindable(),
		batch,
	}: {
		open: boolean;
		batch: NonNullable<AwaitReturn<typeof getBatchWithSubjects>>;
	} = $props();

	let isDeleting = $state(false);
	let isOnTimeout = $state(true);
	const SECONDS_TO_WAIT = 5;

	$effect(() => {
		let timeoutId = null;
		if (open) {
			isOnTimeout = true;
			timeoutId = setTimeout(() => {
				isOnTimeout = false;
			}, SECONDS_TO_WAIT * 1000);
		}
		return () => timeoutId != null && clearTimeout(timeoutId);
	});

	async function destroyBatch() {
		if (isOnTimeout || isDeleting) return;

		isDeleting = true;

		const searchParams = new URLSearchParams({ batchId: batch.id.toString() });
		const response = await fetch(`/api/admin/batch?${searchParams}`, { method: "DELETE" });
		if (!response.ok && response.status !== 400) {
			isDeleting = false;
			toast.error("Failed to delete the batch.");
			return;
		}
		const result: Result<boolean> = await response.json();
		if (!result.ok) {
			isDeleting = false;
			toast.error(result.reason);
			return;
		}

		window.location.assign("..");
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Are you sure you want to delete this batch?</Dialog.Title>
			<Dialog.Description>This action is not reversible.</Dialog.Description>
		</Dialog.Header>

		<div>
			Deleting the batch <span class="font-medium">{batch.name}</span> will also delete
			<span class="text-error-foreground">
				registered students and subjects, subject enrollments and representatives, periods data and
				absentee data
			</span>. <span class="font-medium">And this action is not reversible.</span>
		</div>

		<Dialog.Footer class="gap-y-2">
			<Button onclick={() => (open = false)}>Close</Button>
			<Button variant="destructive" disabled={isOnTimeout || isDeleting} onclick={destroyBatch}>
				{#if isOnTimeout}
					<ClockIcon class="animate-spin" /> Please wait
				{:else if isDeleting}
					<LoaderCircleIcon class="animate-spin" /> Destroying...
				{:else}
					<Trash2Icon /> Destroy subject data
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
