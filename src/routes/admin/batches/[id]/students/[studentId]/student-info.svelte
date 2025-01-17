<script lang="ts">
	import type { getStudent } from "$lib/server/db/students";
	import * as Table from "$lib/components/ui/table";
	import { Button } from "$lib/components/ui/button";
	import { CheckIcon, EditIcon, MinusIcon } from "lucide-svelte";
	import EmptyInfobox from "$lib/components/empty-infobox.svelte";

	interface Props {
		student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
	}

	let { student }: Props = $props();

	function pluralize(count: number, singular: string, plural: string) {
		return count == 1 ? singular : plural;
	}

	function safeDivision(numerator: number, denominator: number) {
		return denominator == 0 ? 0 : numerator / denominator;
	}

	function isRepresentative(subjectId: number) {
		return student.representations.some((repr) => repr.subjectId === subjectId);
	}
</script>

<div class="flex items-center justify-between">
	<h1 class="text-2xl font-medium">{student.fullName}</h1>
	<Button variant="outline"><EditIcon /> Edit</Button>
</div>

<h2 class="font-serif text-2xl italic">Basic Information</h2>

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

<h2 class="font-serif text-2xl italic">
	Enrolled Subjects <span class="text-muted-foreground">({student.enrollments.length})</span>
</h2>
<p>
	Subjects enrolled by the student are shown below. Click on a subject name to see more information
	about them. Edit the student to enroll more subjects or leave the exising ones.
</p>

{#if student.enrollments.length > 0}
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>#</Table.Head>
				<Table.Head>Name</Table.Head>
				<Table.Head class="text-center">Represents</Table.Head>
				<Table.Head class="text-center">Attendance</Table.Head>
				<Table.Head class="text-center">%</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each student.enrollments as enrollment, i}
				<Table.Row>
					<Table.Cell class="text-muted-foreground">{i + 1}</Table.Cell>
					<Table.Cell>{enrollment.subject.name}</Table.Cell>
					<Table.Cell class="text-center"
						>{#if isRepresentative(enrollment.subject.id)}
							<CheckIcon class="inline-block size-4" />
						{:else}
							<MinusIcon class="inline-block size-4" />
						{/if}</Table.Cell
					>
					<Table.Cell class="text-center"
						>{enrollment.subject.periodCount - enrollment.subject.asbentCount} / {enrollment.subject
							.periodCount}</Table.Cell
					>
					<Table.Cell class="text-center"
						>{(
							safeDivision(
								enrollment.subject.periodCount - enrollment.subject.asbentCount,
								enrollment.subject.periodCount,
							) * 100
						).toFixed(2)} %</Table.Cell
					>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{:else}
	<EmptyInfobox>
		<p>The student hasn't been enrolled to any subjects yet.</p>
		<p>Edit the student to enroll to subjects available to the batch.</p>
	</EmptyInfobox>
{/if}

<p class="text-sm leading-relaxed text-muted-foreground">
	Subjects where the student represents the batch are marked by a <CheckIcon
		class="inline-block size-4"
	/>. Being a representative makes them able to update batchmates' attendance for the corresponding
	subject. You can select a subject and promote or demote students to the
	<span class="font-semibold">representative</span> role there.
</p>
