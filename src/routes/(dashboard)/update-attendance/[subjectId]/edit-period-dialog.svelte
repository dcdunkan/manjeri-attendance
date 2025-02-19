<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Table from "$lib/components/ui/table";
	import type { Data, LoadedData, Payload, Result } from "$lib/types";
	import { SvelteDate, SvelteSet, type SvelteMap } from "svelte/reactivity";
	import type { CacheMonthlyData, Subject, EnrolledStudent } from "./types";
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button";
	import { CircleCheckBigIcon, LoaderCircleIcon, TableIcon } from "lucide-svelte";
	import SearchInput from "./search-input.svelte";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { Label } from "$lib/components/ui/label";
	import { extractBaseDate, longDateFormatter } from "$lib/helpers";
	import LoadingCard from "$lib/components/loading-card.svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";

	let {
		subject,
		students,
		open = $bindable(false),
		selectedDate,
		monthlyCache = $bindable(),
		periodData,
		studentMap = $bindable(),
	}: {
		subject: Subject;
		students: EnrolledStudent[];
		open: boolean;
		selectedDate: SvelteDate;
		monthlyCache: SvelteMap<`${number}-${number}`, CacheMonthlyData>;
		periodData: LoadedData<Data.Period.Get>;
		studentMap: Record<number, EnrolledStudent>;
	} = $props();

	let filterString = $state("");
	let showOnlyAbsentees = $state(false);
	let originalAbsentees = new Set<number>(
		periodData.state === "resolved" ? periodData.data.absentees.map((a) => a.studentId) : [],
	);

	let absentees = new SvelteSet<number>(
		periodData.state === "resolved" ? periodData.data.absentees.map((a) => a.studentId) : [],
	);

	let isUpdating = $state(true);

	// Idk if this is the right way to do it, since effects shouldn't be used
	// for setting values with side-effects ideally. But anyway, this seems to work.
	$effect(() => {
		if (periodData.state !== "resolved") {
			isUpdating = true;
			absentees.clear();
			originalAbsentees.clear();
		} else {
			for (const { studentId } of periodData.data.absentees) {
				absentees.add(studentId);
				originalAbsentees.add(studentId);
			}
			isUpdating = false;
		}
	});

	let filteredStudents = $derived(students.filter(filterFn).toSorted(comparatorFn));

	function filterFn(student: EnrolledStudent): boolean {
		if (showOnlyAbsentees) return absentees.has(student.id);
		return student.fullName.toLowerCase().includes(filterString.toLowerCase());
	}
	function comparatorFn(a: EnrolledStudent, b: EnrolledStudent): number {
		return a.rollNumber - b.rollNumber;
	}
	function areEqualSets(a: Set<number>, b: Set<number>) {
		return a.size === b.size && a.symmetricDifference(b).size === 0;
	}

	async function updateAttendance() {
		// TODO: add confirmation
		if (periodData.state !== "resolved" || isUpdating) return;

		isUpdating = true;
		const { data: period } = periodData;

		const response = await fetch("/api/representative/mark-attendance", {
			method: "PATCH",
			body: JSON.stringify({
				subjectId: subject.id,
				periodId: period.id,
				absentees: Array.from(absentees),
			} satisfies Payload.MarkAttendance.PATCH),
			headers: { "Content-Type": "application/json" },
		});
		const result: Result<Data.MarkAttendance> = await response.json();
		if (!result.ok) {
			console.error(result.reason);
			toast.error("Failed to mark the attendance");
			isUpdating = false;
			return;
		}

		for (const absentee of originalAbsentees.difference(absentees)) {
			studentMap[absentee].absentCount -= 1;
		}
		for (const absentee of absentees.difference(originalAbsentees)) {
			studentMap[absentee].absentCount += 1;
		}

		const date = extractBaseDate(selectedDate);
		const cacheKey = `${date.year}-${date.month}` as const;
		const cached = monthlyCache.get(cacheKey);
		if (cached != null) {
			const copy = { ...cached };
			copy[date.date] ??= [];
			const index = copy[date.date].findIndex((p) => p.id === period.id);
			if (index === -1) {
				copy[date.date].push({
					id: result.data.periodId,
					absentees: result.data.absentees,
				});
			} else {
				copy[date.date][index].absentees = result.data.absentees;
			}
			monthlyCache.set(cacheKey, copy);
		}
		open = false;
		isUpdating = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		onOpenAutoFocus={(event) => {
			event.preventDefault();
		}}
		class="flex h-[80vh] max-w-[90vw] flex-col rounded-md transition-all duration-150"
		interactOutsideBehavior="ignore"
		escapeKeydownBehavior="ignore"
		showCloseButton={false}
	>
		<Dialog.Header>
			<Dialog.Title>{longDateFormatter.format(selectedDate)}</Dialog.Title>
			<Dialog.Description>{subject.name}</Dialog.Description>
		</Dialog.Header>

		<SearchInput bind:value={filterString} />

		<div class="flex-grow overflow-y-scroll rounded border">
			{#if periodData.state === "pending"}
				<LoadingCard>
					<div class="flex h-full w-full flex-col items-center justify-center">
						{periodData.message}
					</div>
				</LoadingCard>
			{:else if periodData.state === "resolved"}
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
									<Table.Cell>{student.fullName}</Table.Cell>
									<Table.Cell class="flex justify-center">
										<Checkbox checked={!absentees.has(student.id)} />
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
			{:else if periodData.state === "failed"}
				<LoadingFailedCard>
					<div class="flex h-full items-center justify-center">{periodData.message}</div>
				</LoadingFailedCard>
			{:else}
				<LoadingFailedCard>
					<div>Unknown option.</div>
				</LoadingFailedCard>
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
			<Button class="w-full" variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				class="w-full"
				disabled={periodData.state !== "resolved" ||
					students.length === 0 ||
					isUpdating ||
					areEqualSets(originalAbsentees, absentees)}
				onclick={updateAttendance}
			>
				{#if isUpdating}
					<LoaderCircleIcon class="size-4 animate-spin" /> Loading
				{:else}
					Update
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
