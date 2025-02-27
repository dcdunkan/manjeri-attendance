<script lang="ts">
	import type { getStudent } from "$lib/server/db/students";
	import * as Table from "$lib/components/ui/table";
	import { Button } from "$lib/components/ui/button";
	import { CheckIcon, EditIcon } from "lucide-svelte";
	import EmptyInfobox from "$lib/components/empty-infobox.svelte";
	import { cutePercent, safeDivision } from "$lib/helpers";
	import EditStudentDialog from "./edit-student-dialog.svelte";

	interface Props {
		student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
	}

	let { student }: Props = $props();

	function pluralize(count: number, singular: string, plural: string) {
		return count == 1 ? singular : plural;
	}

	function isRepresentative(subjectId: number) {
		return student.representations.some((repr) => repr.subjectId === subjectId);
	}

	let showEditStudentDialog = $state(false);
</script>

<div class="flex items-center justify-between">
	<h1 class="text-2xl font-medium">{student.fullName}</h1>
	<Button variant="outline" onclick={() => (showEditStudentDialog = true)}>
		<EditIcon /> Edit
	</Button>
</div>

<EditStudentDialog bind:open={showEditStudentDialog} bind:student />

<h2 class="text-xl">Basic Information</h2>

<Table.Root>
	<Table.Body>
		<Table.Row>
			<Table.Head class="max-w-min text-primary">ID</Table.Head>
			<Table.Cell>{student.id}</Table.Cell>
		</Table.Row>
		<Table.Row>
			<Table.Head class="max-w-min text-primary">Login ID</Table.Head>
			<Table.Cell>{student.account.login}</Table.Cell>
		</Table.Row>
		<Table.Row>
			<Table.Head class="max-w-min text-primary">Full Name</Table.Head>
			<Table.Cell>{student.fullName}</Table.Cell>
		</Table.Row>
		<Table.Row>
			<Table.Head class="max-w-min text-primary">Batch</Table.Head>
			<Table.Cell
				><span>{student.batch.name}</span>
				<span class="text-muted-foreground">(ID: {student.batch.id})</span></Table.Cell
			>
		</Table.Row>
		<Table.Row>
			<Table.Head class="max-w-min text-primary">Roll Number</Table.Head>
			<Table.Cell>{student.rollNumber}</Table.Cell>
		</Table.Row>
		<Table.Row>
			<Table.Head class="max-w-min text-primary">Represents</Table.Head>
			<Table.Cell
				>{student.representations.length}
				{pluralize(student.representations.length, "subject", "subjects")}</Table.Cell
			>
		</Table.Row>
		<Table.Row>
			<Table.Head class="max-w-min text-primary">No. of Enrolled Subjects</Table.Head>
			<Table.Cell
				>{student.enrollments.length}
				{pluralize(student.enrollments.length, "subject", "subjects")}</Table.Cell
			>
		</Table.Row>
	</Table.Body>
</Table.Root>

<div class="space-y-2">
	<h2 class="text-xl">Enrolled Subjects ({student.enrollments.length})</h2>
</div>

{#if student.enrollments.length > 0}
	<div class="space-y-2">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>#</Table.Head>
					<Table.Head>Name</Table.Head>
					<Table.Head class="text-center">Attendance</Table.Head>
					<Table.Head class="text-center">%</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each student.enrollments as enrollment, i}
					{@const classes = enrollment.subject.periodCount}
					{@const attended = enrollment.subject.periodCount - enrollment.subject.asbentCount}
					<Table.Row>
						<Table.Cell class="text-muted-foreground">{i + 1}</Table.Cell>
						<Table.Cell>
							{enrollment.subject.name}
							{#if isRepresentative(enrollment.subject.id)}
								<CheckIcon class="inline-block size-4 text-yellow-500" />
							{/if}
						</Table.Cell>
						<Table.Cell class="text-center">{attended} / {classes}</Table.Cell>
						<Table.Cell class="text-center">
							{cutePercent(safeDivision(attended, classes) * 100)} %
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<div class="flex place-items-center justify-center gap-2 text-xs text-muted-foreground">
			<CheckIcon class="size-4 text-yellow-500" /> Representative for the subject.
		</div>
	</div>
{:else}
	<EmptyInfobox>
		<p>The student hasn't been enrolled to any subjects yet.</p>
	</EmptyInfobox>
{/if}

<p class="text-sm leading-relaxed text-muted-foreground">
	You can go to a specific subject page and enroll and delist the student. You can also promote or
	demote the student from the same page to make them represent the batch for the subject.
</p>
