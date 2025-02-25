<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import type { getSubject } from "$lib/server/db/subjects";
	import type { AwaitReturn, Result } from "$lib/types";
	import { ClockIcon, LoaderCircleIcon, Trash2Icon } from "lucide-svelte";
	import { toast } from "svelte-sonner";

	let {
		open = $bindable(),
		subject,
	}: {
		open: boolean;
		subject: AwaitReturn<typeof getSubject>;
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

	async function destroySubject() {
		if (isOnTimeout || isDeleting) return;

		isDeleting = true;

		const searchParams = new URLSearchParams({
			subjectId: subject.id.toString(),
			batchId: subject.batch.id.toString(),
		});
		const response = await fetch(`/api/admin/subjects?${searchParams}`, { method: "DELETE" });
		if (!response.ok && response.status !== 400) {
			isDeleting = false;
			toast.error("Failed to delete the subject.");
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
			<Dialog.Title>Are you sure you want to delete this subject?</Dialog.Title>
			<Dialog.Description>This action is not reversible.</Dialog.Description>
		</Dialog.Header>

		<div>
			Deleting the subject <span class="font-medium">{subject.name}</span> of the batch
			<span class="font-medium">{subject.batch.name}</span>, will also
			<span class="underline underline-offset-4">
				all the students enrolled, periods data and absentee data
			</span>. <span class="font-medium">And this action is not reversible.</span>
		</div>

		<Dialog.Footer class="gap-y-2">
			<Button onclick={() => (open = false)}>Close</Button>
			<Button variant="destructive" disabled={isOnTimeout || isDeleting} onclick={destroySubject}>
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
