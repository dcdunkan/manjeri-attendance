<script lang="ts">
	import * as Table from "$lib/components/ui/table/index";
	import { CheckIcon, MinusIcon } from "lucide-svelte";
	import { cutePercent, safeDivision } from "$lib/helpers";
	import PromoteDialog from "./promote-dialog.svelte";
	import type { getEnrolledStudents } from "$lib/server/db/enrollments";
	import type { getSubject } from "$lib/server/db/subjects";

	let {
		subject,
		enrollments: xenrollments,
	}: {
		enrollments: Awaited<ReturnType<typeof getEnrolledStudents>>;
		subject: Awaited<ReturnType<typeof getSubject>>;
	} = $props();

	let enrollments = $state([...xenrollments]);
	let representatives = $state([...subject.representatives]);
</script>

{#if representatives.length === 0}
	<div
		class="rounded border-2 border-warning-border bg-warning p-3 text-sm font-medium text-warning-foreground"
	>
		Warning: There is no one representing the batch for this subject.
	</div>
{/if}

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-fit">#</Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head class="text-center">Represents</Table.Head>
			<Table.Head class="text-center">Attendance</Table.Head>
			<Table.Head class="text-center">Actions</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each enrollments as enrollment}
			<Table.Row>
				<Table.Cell class="w-fit">{enrollment.student.rollNumber}</Table.Cell>
				<Table.Cell class="font-medium">{enrollment.student.fullName}</Table.Cell>
				<Table.Cell class="text-center">
					{#if representatives.find((rep) => rep.studentId === enrollment.student.id) != null}
						<CheckIcon class="inline-block size-4" />
					{:else}
						<MinusIcon class="inline-block size-4" />
					{/if}
				</Table.Cell>
				<Table.Cell class="text-center">
					{@const classes = Number(subject.periodCount)}
					{@const attended = classes - enrollment.student.absentCount}
					{cutePercent(safeDivision(attended, classes) * 100)} % ({attended} / {classes})
				</Table.Cell>
				<Table.Cell class="text-center">
					<PromoteDialog {subject} {enrollment} {representatives} />
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
