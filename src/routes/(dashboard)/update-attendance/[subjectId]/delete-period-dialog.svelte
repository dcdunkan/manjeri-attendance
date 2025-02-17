<script lang="ts">
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { ClockIcon, LoaderCircleIcon, Trash2Icon, TrashIcon } from "lucide-svelte";
	import type { SvelteDate, SvelteMap } from "svelte/reactivity";
	import type { CacheMonthlyData, EnrolledStudent, Subject } from "./types";
	import type { Data, Result } from "$lib/types";
	import { toast } from "svelte-sonner";
	import { extractBaseDate, pluralize } from "$lib/helpers";

	let {
		subject,
		periodId,
		monthlyCache = $bindable(),
		selectedDate,
		periodCount = $bindable(0),
		studentMap = $bindable(),
	}: {
		periodId: number;
		subject: Subject;
		selectedDate: SvelteDate;
		monthlyCache: SvelteMap<`${number}-${number}`, CacheMonthlyData>;
		periodCount: number;
		studentMap: Record<number, EnrolledStudent>;
	} = $props();

	let isOpen = $state(false);
	let isDeleting = $state(false);
	let isOnTimeout = $state(true);

	const SECONDS_TO_WAIT = 3;

	$effect(() => {
		let timeoutId = null;
		if (isOpen) {
			isOnTimeout = true;
			timeoutId = setTimeout(() => {
				isOnTimeout = false;
			}, SECONDS_TO_WAIT * 1000);
		}
		return () => timeoutId != null && clearTimeout(timeoutId);
	});
</script>

<Dialog.Root
	open={isOpen}
	onOpenChange={(currentValue) => {
		isOpen = currentValue;
	}}
>
	<Dialog.Trigger class={buttonVariants({ variant: "destructive" })}>
		<TrashIcon class="size-3" />
	</Dialog.Trigger>
	<Dialog.Content class="max-w-[90vw] md:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
			<Dialog.Description>This action cannot be undone!</Dialog.Description>
		</Dialog.Header>

		<div
			class="rounded-sm border-2 border-error-border bg-error p-3 text-sm font-medium text-error-foreground"
		>
			This will remove all the recorded absentees, and period information and will affect the
			attendance of students enrolled to the subject.
		</div>

		<Dialog.Footer class="gap-y-2">
			<Button onclick={() => (isOpen = false)} variant="outline">Cancel</Button>
			<Button
				variant="destructive"
				disabled={isOnTimeout || isDeleting}
				onclick={async () => {
					isDeleting = true;

					const searchParams = new URLSearchParams({
						subjectId: subject.id.toString(),
						periodId: periodId.toString(),
					});
					const response = await fetch(`/api/representative/mark-attendance?${searchParams}`, {
						method: "DELETE",
					});

					const result: Result<Data.Period.Delete> = await response.json();
					if (!result.ok) {
						console.error(result.reason);
						toast.error("Failed to mark the attendance");
					} else {
						for (const { id } of result.data.deletedAbsentees) {
							studentMap[id].absentCount -= 1;
						}

						periodCount -= 1;
						const date = extractBaseDate(selectedDate);
						const cacheKey = `${date.year}-${date.month}` as const;
						const cached = monthlyCache.get(cacheKey);
						if (cached?.[date.date] != null && Array.isArray(cached[date.date])) {
							const copy = { ...cached };
							const index = copy[date.date].findIndex(({ id }) => id === periodId);
							if (index !== -1) {
								copy[date.date].splice(index, 1);
								monthlyCache.set(cacheKey, copy);
							}
						}
						toast.success(
							`Deleted period with ${result.data.deletedAbsentees.length} ${pluralize(result.data.deletedAbsentees.length, "absentee", "absentees")}`,
						);
					}

					isOpen = false;
					isDeleting = false;
				}}
			>
				{#if isOnTimeout}
					<ClockIcon class="animate-spin" /> Please wait
				{:else if isDeleting}
					<LoaderCircleIcon class="animate-spin" /> Destroying...
				{:else}
					<Trash2Icon /> Destroy period data
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
