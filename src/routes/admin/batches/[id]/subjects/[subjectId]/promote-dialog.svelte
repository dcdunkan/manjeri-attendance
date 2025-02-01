<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import type { getEnrolledStudents } from "$lib/server/db/enrollments";
	import type { getSubject } from "$lib/server/db/subjects";
	import { EllipsisVerticalIcon, LoaderCircleIcon } from "lucide-svelte";
	import type { Data, Payload, Result } from "$lib/types";
	import { toast } from "svelte-sonner";
	import { type Representative } from "$lib/server/db/schema";

	let {
		subject,
		enrollment,
		representatives,
	}: {
		enrollment: Awaited<ReturnType<typeof getEnrolledStudents>>[number];
		subject: Awaited<ReturnType<typeof getSubject>>;
		representatives: (Representative & { student: { fullName: string } })[];
	} = $props();

	let represents = $derived(representatives.some((rep) => rep.studentId === enrollment.student.id));
	let dialogOpen = $state(false);
	let isLoading = $state(false);

	async function togglePromote() {
		isLoading = true;

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

		dialogOpen = false;

		// TODO: What about response.ok?
		const result: Result<Data.ToggleRepresentative> = await response.json();

		if (!result.ok) {
			toast.error(`Failed to ${represents ? "demote" : "promote"} the student.`);
		} else {
			if (result.data.status === "demoted") {
				const index = representatives.findIndex((rep) => rep.id === result.data.representative.id);
				if (index !== -1) representatives.splice(index, 1);
			} else if (result.data.status === "promoted") {
				representatives.push({
					...result.data.representative,
					student: { fullName: enrollment.student.fullName },
				});
			}
			toast.success(
				`Successfully ${represents ? "demote" : "promote"}d ${enrollment.student.fullName}.`,
			);
		}

		isLoading = false;
	}
</script>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title class="mb-2">
				Do you really want to {represents ? "demote" : "promote"}
				{enrollment.student.fullName}?
			</Dialog.Title>
			<Dialog.Description class="space-y-2">
				{#if represents}
					<p>
						This will remove the ability of {enrollment.student.fullName} for modifying and managing
						the attendance of the batchmates.
					</p>

					{#if representatives.length > 1}
						<p>The following students will be left for representing the students:</p>
						<ul class="ml-4 list-inside list-disc">
							{#each representatives.filter((rep) => rep.studentId !== enrollment.student.id) as rep}
								<li class="list-item">{rep.student.fullName}</li>
							{/each}
						</ul>
					{:else}
						<p class="font-semibold text-warning-foreground">
							Warning: There won't be any representatives left for the subject {subject.name}.
						</p>
					{/if}
				{:else}
					This will give <span class="font-bold">{enrollment.student.fullName}</span>
					full access to marking and modifying the attendance of students enrolled to the course
					<span class="font-bold">{subject.name}</span>,
					<span class="underline underline-offset-4">including their own attendance</span>.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer>
			<Button disabled={isLoading} onclick={togglePromote}>
				{#if isLoading}
					<LoaderCircleIcon class="size-3 animate-spin" />
				{:else}
					{represents ? "Demote" : "Promote"}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<div class="p-1">
			<EllipsisVerticalIcon />
		</div>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.GroupHeading>Actions</DropdownMenu.GroupHeading>
			<DropdownMenu.Separator />
			<DropdownMenu.Item>Profile</DropdownMenu.Item>
			<DropdownMenu.Item>Delist</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => (dialogOpen = true)}>
				{#if represents}
					Demote
				{:else}
					Promote
				{/if}
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
