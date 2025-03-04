<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import type { getEnrolledStudents } from "$lib/server/db/enrollments";
	import type { getSubject } from "$lib/server/db/subjects";
	import { EllipsisVerticalIcon, LoaderCircleIcon } from "lucide-svelte";
	import type { Data, Payload, Result } from "$lib/types";
	import { toast } from "svelte-sonner";

	let {
		subject = $bindable(),
		enrollments = $bindable(),
		enrollmentId,
	}: {
		enrollments: Awaited<ReturnType<typeof getEnrolledStudents>>;
		enrollmentId: number;
		subject: Awaited<ReturnType<typeof getSubject>>;
	} = $props();

	let enrollment = $derived(enrollments.find((enrollment) => enrollment.id === enrollmentId)!);
	let represents = $derived(
		subject.representatives.some((rep) => rep.studentId === enrollment.student.id),
	);

	let promoteDialogOpen = $state(false);
	let isPromoteLoading = $state(false);

	let delistDialogOpen = $state(false);
	let isDelistLoading = $state(false);

	async function togglePromote() {
		isPromoteLoading = true;

		const response = await fetch("/api/admin/subjects/toggle-representative", {
			method: "POST",
			body: JSON.stringify({
				action: represents ? "demote" : "promote",
				batchId: subject.batch.id,
				subjectId: subject.id,
				studentId: enrollment.student.id,
			} satisfies Payload.ToggleRepresentative),
			headers: { "Content-Type": "application/json" },
		});

		promoteDialogOpen = false;

		// TODO: What about response.ok?
		const result: Result<Data.ToggleRepresentative> = await response.json();

		if (!result.ok) {
			toast.error(`Failed to ${represents ? "demote" : "promote"} the student.`);
		} else {
			if (result.data.status === "demoted") {
				const index = subject.representatives.findIndex(
					(rep) => rep.id === result.data.representative.id,
				);
				if (index !== -1) subject.representatives.splice(index, 1);
			} else if (result.data.status === "promoted") {
				subject.representatives.push({
					...result.data.representative,
					student: { fullName: enrollment.student.fullName },
				});
			}
			toast.success(`Successfully ${result.data.status} ${enrollment.student.fullName}.`);
		}

		isPromoteLoading = false;
	}

	async function delistEnrollment() {
		isDelistLoading = true;
		const response = await fetch("/api/admin/subjects/delist-enrollment", {
			method: "POST",
			body: JSON.stringify({
				batchId: subject.batch.id,
				subjectId: subject.id,
				enrollmentId: enrollment.id,
				studentId: enrollment.student.id,
			} satisfies Payload.DelistEnrollment),
			headers: { "Content-Type": "application/json" },
		});

		if (!response.ok && response.status !== 400) {
			isDelistLoading = false;
			toast.error("Failed to delist student.");
			return;
		}
		const result: Result<Data.DelistEnrollment> = await response.json();
		if (!result.ok) {
			isDelistLoading = false;
			toast.error("Failed to delist student.");
			return;
		}

		if (represents) {
			const repIndex = subject.representatives.findIndex(
				(rep) => rep.studentId === enrollment.student.id,
			);
			if (repIndex !== -1) subject.representatives.splice(repIndex, 1);
		}
		const enrollmentIndex = enrollments.findIndex(({ id }) => enrollment.id === id);
		if (enrollmentIndex !== -1) enrollments.splice(enrollmentIndex, 1);

		delistDialogOpen = false;
		isDelistLoading = false;

		toast.success(`Delisted student and deleted ${result.data.absentCount} absent data`);
	}
</script>

<Dialog.Root bind:open={promoteDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				Do you really want to {represents ? "demote" : "promote"}
				{enrollment.student.fullName}?
			</Dialog.Title>
			<Dialog.Description>This action has irreversible consequences.</Dialog.Description>
		</Dialog.Header>

		{#if represents}
			<p>
				This will remove the ability of {enrollment.student.fullName} for modifying and managing the
				attendance of the batchmates.
			</p>

			{#if subject.representatives.length > 1}
				<p>The following students will be left for representing the students:</p>
				<ul class="ml-4 list-inside list-disc">
					{#each subject.representatives.filter((rep) => rep.studentId !== enrollment.student.id) as rep}
						<li class="list-item">{rep.student.fullName}</li>
					{/each}
				</ul>
			{:else}
				<p class="font-semibold text-warning-foreground">
					Warning: There won't be any representatives left for the subject {subject.name}.
				</p>
			{/if}
		{:else}
			<p>
				This will give <span class="font-bold">{enrollment.student.fullName}</span>
				full access to marking and modifying the attendance of students enrolled to the course
				<span class="font-bold">{subject.name}</span>,
				<span class="underline underline-offset-4">including their own attendance</span>.
			</p>
		{/if}

		<Dialog.Footer>
			<Button disabled={isPromoteLoading} onclick={togglePromote}>
				{#if isPromoteLoading}
					<LoaderCircleIcon class="size-3 animate-spin" />
				{:else}
					{represents ? "Demote" : "Promote"}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={delistDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				Do you really want to delist {enrollment.student.fullName}?
			</Dialog.Title>
			<Dialog.Description>This action has irreversible consequences.</Dialog.Description>
		</Dialog.Header>

		<p>
			By doing so you will remove the enrollment of
			<span class="font-medium">{enrollment.student.fullName}</span>
			from the subject,
			<span class="font-medium">{subject.name}</span>.
			<span class="underline decoration-dotted underline-offset-4">
				This will also delete all the period absentee data of the said student.
			</span>
		</p>

		{#if represents}
			<p>
				<span class="font-bold">As the student was a representative</span>, they can't no longer
				manage the attendance of the other students.
			</p>

			{#if subject.representatives.length === 1}
				<p class="font-semibold text-warning-foreground">
					Warning: There won't be any representatives left for the subject {subject.name}.
				</p>
			{/if}
		{/if}

		<Dialog.Footer>
			<Button variant="destructive" disabled={isDelistLoading} onclick={delistEnrollment}>
				{#if isDelistLoading}
					<LoaderCircleIcon class="size-3 animate-spin" />
				{:else}
					Yes, delist {enrollment.student.fullName}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<EllipsisVerticalIcon class="inline-block size-4" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.GroupHeading>Actions</DropdownMenu.GroupHeading>
			<DropdownMenu.Separator />
			<a href="../students/{enrollment.student.id}">
				<DropdownMenu.Item class="cursor-pointer">Profile</DropdownMenu.Item>
			</a>
			<DropdownMenu.Item onclick={() => (delistDialogOpen = true)}>Delist</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => (promoteDialogOpen = true)}>
				{#if represents}
					Demote
				{:else}
					Promote
				{/if}
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
