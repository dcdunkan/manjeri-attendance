<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import type { getStudent } from "$lib/server/db/students";
	import type { AwaitReturn, Result } from "$lib/types";
	import { ClockIcon, LoaderCircleIcon, Trash2Icon } from "lucide-svelte";
	import { toast } from "svelte-sonner";

	let {
		open = $bindable(),
		student,
	}: {
		open: boolean;
		student: NonNullable<AwaitReturn<typeof getStudent>>;
	} = $props();

	let isDeleting = $state(false);
	let isOnTimeout = $state(true);
	const SECONDS_TO_WAIT = 2;

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

	async function destroyStudent() {
		if (isOnTimeout || isDeleting) return;

		isDeleting = true;

		const searchParams = new URLSearchParams({ studentId: student.id.toString() });
		const response = await fetch(`/api/admin/batch/student?${searchParams}`, { method: "DELETE" });
		if (!response.ok && response.status !== 400) {
			isDeleting = false;
			toast.error("Failed to delete the student.");
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
			<Dialog.Title>Are you sure you want to delete this student?</Dialog.Title>
			<Dialog.Description>This action is not reversible.</Dialog.Description>
		</Dialog.Header>

		<div>
			Deleting the student <span class="font-medium">{student.fullName}</span> will also delete
			<span class="text-error-foreground"> enrollments, representations, and absentee data </span>.
			<span class="font-medium">And this action is not reversible.</span>
		</div>

		<Dialog.Footer class="gap-y-2">
			<Button variant="secondary" onclick={() => (open = false)}>Close</Button>
			<Button variant="destructive" disabled={isOnTimeout || isDeleting} onclick={destroyStudent}>
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
