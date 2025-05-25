<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import type { CacheMonthlyData, EnrolledStudent, Subject } from "./types";
	import Button from "$lib/components/ui/button/button.svelte";
	import { Calendar } from "$lib/components/ui/calendar";
	import { getLocalTimeZone, today } from "@internationalized/date";
	import {
		CircleCheckBigIcon,
		LoaderCircleIcon,
		TableIcon,
		TriangleAlertIcon,
	} from "lucide-svelte";
	import clsx from "clsx";
	import * as Table from "$lib/components/ui/table";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { SvelteDate, SvelteMap, SvelteSet } from "svelte/reactivity";
	import { Label } from "$lib/components/ui/label";
	import { toast } from "svelte-sonner";
	import type { Data, Payload, Result } from "$lib/types";
	import SearchInput from "$lib/components/search-input.svelte";
	import { longDateFormatter } from "$lib/helpers";

	let {
		students,
		studentMap = $bindable(),
		subject = $bindable(),
		open = $bindable(false),
		monthlyCache = $bindable(),
		periodCount = $bindable(0),
		selectedDate = $bindable(),
	}: {
		students: EnrolledStudent[];
		subject: Subject;
		open: boolean;
		monthlyCache: SvelteMap<`${number}-${number}`, CacheMonthlyData>;
		periodCount: number;
		studentMap: Record<number, EnrolledStudent>;
		selectedDate: SvelteDate;
	} = $props();

	const timezone = getLocalTimeZone();
	const maxValue = today(timezone);
	const lastUpdatableDays = 365; // 7;
	const minValue = maxValue.subtract({ days: lastUpdatableDays - 1 });
	let value = $state(maxValue);

	let showList = $state(false);

	let absentees = new SvelteSet<number>();
	let showOnlyAbsentees = $state(false);
	let filterString = $state("");

	$effect(() => {
		if (showList) {
			absentees.clear();
			showOnlyAbsentees = false;
			filterString = "";
		}
	});

	let filteredStudents = $derived(students.filter(filterFn).toSorted(comparatorFn));

	let isSaving = $state(false);

	function filterFn(student: EnrolledStudent): boolean {
		if (showOnlyAbsentees) {
			return absentees.has(student.id);
		}
		return student.fullName.toLowerCase().includes(filterString.toLowerCase());
	}

	function comparatorFn(a: EnrolledStudent, b: EnrolledStudent): number {
		return a.rollNumber - b.rollNumber;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="w-auto rounded-md transition-all duration-150">
		<Dialog.Header>
			<Dialog.Title>Pick a date</Dialog.Title>
			<Dialog.Description>Pick a date for marking the attendance.</Dialog.Description>
		</Dialog.Header>

		<div class="flex justify-center">
			<Calendar type="single" bind:value {maxValue} {minValue} preventDeselect />
		</div>

		<Dialog.Footer>
			<Button
				disabled={value == null}
				class={clsx("w-full", value == null && "bg-warning-foreground")}
				onclick={() => {
					showList = true;
					open = false;
				}}
			>
				{#if value}
					Continue
				{:else}
					<TriangleAlertIcon /> Pick a date to continue
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showList}>
	<Dialog.Content
		onOpenAutoFocus={(event) => {
			event.preventDefault();
		}}
		class="flex h-[80vh] max-w-[90vw] flex-col rounded-md transition-all duration-150 sm:max-w-lg"
		interactOutsideBehavior="ignore"
		escapeKeydownBehavior="ignore"
		showCloseButton={false}
	>
		<Dialog.Header>
			<Dialog.Title>{longDateFormatter.format(value.toDate(getLocalTimeZone()))}</Dialog.Title>
			<Dialog.Description>{subject.name}</Dialog.Description>
		</Dialog.Header>

		<SearchInput bind:value={filterString} placeholder="Filter students..." />

		<div class="flex-grow overflow-y-scroll rounded border">
			{#if filteredStudents.length === 0}
				<div class="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
					{#if showOnlyAbsentees}
						<CircleCheckBigIcon />
						<p>All good, no one's absent!</p>
					{:else}
						<TableIcon />
						<p>No matching students were found.</p>
					{/if}
				</div>
			{:else}
				<Table.Root class="text-sm">
					<Table.Body>
						{#each filteredStudents as student}
							<Table.Row
								onclick={() => {
									if (absentees.has(student.id)) absentees.delete(student.id);
									else absentees.add(student.id);
								}}
							>
								<Table.Cell class="w-[80px] text-center">{student.rollNumber}</Table.Cell>
								<Table.Cell>
									{student.fullName}
								</Table.Cell>
								<Table.Cell class="flex justify-center">
									<Checkbox checked={!absentees.has(student.id)} />
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</div>

		<div class="flex justify-between">
			<div class="flex items-center space-x-2">
				<Checkbox id="showOnlyAbsentees" bind:checked={showOnlyAbsentees} />
				<Label for="showOnlyAbsentees">Show absentees only</Label>
			</div>

			<div class="text-sm">
				{students.length} <span class="text-muted-foreground">/</span>
				{students.length - absentees.size} <span class="text-muted-foreground">/</span>
				{absentees.size}
			</div>
		</div>

		<Dialog.Footer class="gap-y-2">
			<Button class="w-full" variant="outline" onclick={() => (showList = false)}>Cancel</Button>
			<Button
				class="w-full"
				disabled={students.length === 0 || isSaving}
				onclick={async () => {
					isSaving = true;
					const response = await fetch("/api/representative/mark-attendance", {
						method: "POST",
						body: JSON.stringify({
							subjectId: subject.id,
							date: value.toString(),
							absentees: Array.from(absentees),
						} satisfies Payload.MarkAttendance.POST),
						headers: { "Content-Type": "application/json" },
					});
					const result: Result<Data.MarkAttendance> = await response.json();
					if (!result.ok) {
						console.error(result.reason);
						toast.error("Failed to mark the attendance");
						isSaving = false;
						return;
					}

					for (const absentee of absentees) {
						studentMap[absentee].absentCount += 1;
					}
					periodCount += 1;

					const cacheKey = `${value.year}-${value.month - 1}` as const;
					const cached = monthlyCache.get(cacheKey);
					if (cached != null) {
						const copy = { ...cached };
						copy[value.day] ??= [];
						copy[value.day].push({
							id: result.data.periodId,
							absentees: result.data.absentees,
						});
						monthlyCache.set(cacheKey, copy);
					}
					selectedDate.setTime(value.toDate(timezone).getTime());
					showList = false;
					isSaving = false;
				}}
			>
				{#if isSaving}
					<LoaderCircleIcon class="size-4 animate-spin" /> Loading
				{:else}
					Mark attendance
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
