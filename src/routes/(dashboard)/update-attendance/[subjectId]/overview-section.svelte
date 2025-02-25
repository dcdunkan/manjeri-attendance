<script lang="ts">
	import * as Table from "$lib/components/ui/table";
	import type { ArrayIndices } from "$lib/types";
	import { ArrowDown10Icon, ArrowUp01Icon, ArrowUpDownIcon } from "lucide-svelte";
	import type { EnrolledStudent } from "./types";
	import SearchInput from "$lib/components/search-input.svelte";
	import { cutePercent, safeDivision } from "$lib/helpers";

	let {
		filterString = $bindable(""),
		studentMap,
		periodCount,
	}: {
		filterString: string;
		studentMap: Record<number, EnrolledStudent>;
		periodCount: number;
	} = $props();

	function filterFn(student: EnrolledStudent) {
		return student.fullName.toLowerCase().includes(filterString.toLowerCase());
	}
	function comparatorFn(a: EnrolledStudent, b: EnrolledStudent): number {
		const positioning = b.absentCount - a.absentCount; /// TODO: verify
		const multiplier =
			sortDirs[attendanceSort] === "ascending"
				? 1
				: sortDirs[attendanceSort] === "descending"
					? -1
					: 0;
		return positioning * multiplier;
	}

	const sortDirs = ["unsorted", "ascending", "descending"] as const;
	let attendanceSort = $state<ArrayIndices<typeof sortDirs>>(0);
</script>

<div class="sticky">
	<SearchInput bind:value={filterString} placeholder="Filter students..." />
</div>

<Table.Root class="mt-3">
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-min text-center">#</Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head class="flex justify-center">
				<button
					class="flex place-items-center gap-2"
					onclick={() => {
						attendanceSort = (attendanceSort + 1) % sortDirs.length;
					}}
				>
					Attendance
					{#if sortDirs[attendanceSort] === "unsorted"}
						<ArrowUpDownIcon class="size-4" />
					{:else if sortDirs[attendanceSort] === "ascending"}
						<ArrowUp01Icon class="size-4" />
					{:else if sortDirs[attendanceSort] === "descending"}
						<ArrowDown10Icon class="size-4" />
					{/if}
				</button>
			</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each Object.values(studentMap).filter(filterFn).toSorted(comparatorFn) as student}
			{@const attended = periodCount - student.absentCount}
			<Table.Row>
				<Table.Cell class="w-min text-center">{student.rollNumber}</Table.Cell>
				<Table.Cell>{student.fullName}</Table.Cell>
				<Table.Cell class="text-center">
					{cutePercent(safeDivision(attended, periodCount) * 100)} % ({attended} /
					{periodCount})
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
