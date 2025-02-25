<script lang="ts">
	import * as Table from "$lib/components/ui/table/index";
	import { CheckIcon } from "lucide-svelte";
	import { cutePercent, safeDivision } from "$lib/helpers";
	import PromoteDialog from "./promote-dialog.svelte";
	import type { getEnrolledStudents } from "$lib/server/db/enrollments";
	import type { getSubject } from "$lib/server/db/subjects";
	import SearchInput from "$lib/components/search-input.svelte";
	import type { AwaitReturn } from "$lib/types";

	type Enrollment = AwaitReturn<typeof getEnrolledStudents>[number];

	let {
		subject = $bindable(),
		enrollments,
	}: {
		enrollments: Enrollment[];
		subject: Awaited<ReturnType<typeof getSubject>>;
	} = $props();

	const subjectPeriodCount = Number(subject.periodCount);

	let filterString = $state("");

	function comparatorFn(a: Enrollment, b: Enrollment) {
		return a.student.rollNumber - b.student.rollNumber;
	}
	function filterFn({ student }: Enrollment) {
		return student.fullName.toLowerCase().includes(filterString.toLowerCase());
	}
</script>

{#if subject.representatives.length === 0}
	<div
		class="rounded border-2 border-warning-border bg-warning p-3 text-sm font-medium text-warning-foreground"
	>
		Warning: There is no one representing the batch for this subject.
	</div>
{/if}

<SearchInput bind:value={filterString} placeholder="Filter students..." />

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-fit">#</Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head class="text-center">Attendance</Table.Head>
			<Table.Head class="text-center">Actions</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each enrollments.filter(filterFn).toSorted(comparatorFn) as enrollment}
			{@const attended = subjectPeriodCount - enrollment.student.absentCount}
			<Table.Row>
				<Table.Cell class="w-fit">{enrollment.student.rollNumber}</Table.Cell>
				<Table.Cell class="flex place-items-center gap-x-1.5">
					{enrollment.student.fullName}

					{#if subject.representatives.findIndex((rep) => rep.studentId === enrollment.student.id) !== -1}
						<CheckIcon class="inline-block size-4 text-yellow-500" />
					{/if}
				</Table.Cell>
				<Table.Cell class="text-center">
					{cutePercent(safeDivision(attended, subjectPeriodCount) * 100)} % ({attended} / {subjectPeriodCount})
				</Table.Cell>
				<Table.Cell class="text-center">
					<!-- TODO: make this drop down a dialog upon clicking the row -->
					<PromoteDialog bind:subject {enrollments} enrollmentId={enrollment.id} />
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
