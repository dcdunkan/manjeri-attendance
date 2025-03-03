<script lang="ts">
	import {
		EditIcon,
		SquareUserRound,
		Trash2Icon,
		UserRoundPlusIcon,
		UsersRoundIcon,
	} from "lucide-svelte";
	import type { PageData } from "./$types";
	import EnrollmentTable from "./enrollment-table.svelte";
	import { Button } from "$lib/components/ui/button";
	import EditSubjectDialog from "./edit-subject-dialog.svelte";
	import type { LoadedData, AwaitReturn } from "$lib/types";
	import type { getSubject } from "$lib/server/db/subjects";
	import type { getEnrolledStudents } from "$lib/server/db/enrollments";
	import LoadingCard from "$lib/components/loading-card.svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { cutePercent, pluralize, safeDivision } from "$lib/helpers";
	import ManageStudentDialog from "./manage-student-dialog.svelte";
	import DeleteSubjectDialog from "./delete-subject-dialog.svelte";

	let { data }: { data: PageData } = $props();

	let subject = $state<LoadedData<AwaitReturn<typeof getSubject>>>({
		state: "pending",
		message: "Loading subject data...",
	});
	let enrollments = $state<LoadedData<AwaitReturn<typeof getEnrolledStudents>>>({
		state: "pending",
		message: "Fetching enrollments...",
	});

	onMount(async () => {
		try {
			const result = await data.subject;
			subject = { state: "resolved", data: result };
			try {
				enrollments = { state: "resolved", data: await data.students };
			} catch (error) {
				enrollments = { state: "failed", message: "Couldn't fetch enrollments" };
				toast.error("Couldn't fetch enrollments");
			}
		} catch (error) {
			subject = { state: "failed", message: "Failed to load subject data" };
			toast.error("Failed to load subject data");
		}
	});

	let showEnrollmentManageDialog = $state(false);
	let showSubjectEditDialog = $state(false);
	let showDeleteDialog = $state(false);
</script>

{#if subject.state === "pending"}
	<LoadingCard>
		<div>{subject.message}</div>
	</LoadingCard>
{:else if subject.state === "resolved"}
	<div class="flex place-items-center justify-between">
		<h1 class="flex place-items-baseline gap-2 text-2xl">
			{subject.data.name}
			<button onclick={() => (showSubjectEditDialog = true)}>
				<EditIcon class="size-4 text-muted-foreground" />
			</button>
		</h1>
		<div>
			<Button variant="outline" onclick={() => (showEnrollmentManageDialog = true)}>
				<UsersRoundIcon /> Manage
			</Button>
			<Button variant="destructive" onclick={() => (showDeleteDialog = true)}>
				<Trash2Icon />
			</Button>
		</div>
	</div>

	<EditSubjectDialog bind:open={showSubjectEditDialog} bind:subject={subject.data} />
	<DeleteSubjectDialog bind:open={showDeleteDialog} subject={subject.data} />

	{#if enrollments.state === "pending"}
		<LoadingCard>
			<div>{enrollments.message}</div>
		</LoadingCard>
	{:else if enrollments.state === "resolved"}
		{@const totalAbsents = enrollments.data.reduce((p, c) => p + Number(c.student.absentCount), 0)}
		{@const totalPeriodEvents = Number(subject.data.periodCount) * enrollments.data.length}

		<ManageStudentDialog
			bind:open={showEnrollmentManageDialog}
			bind:subject={subject.data}
			bind:enrollments={enrollments.data}
		/>

		<div class="grid grid-cols-3 gap-4 rounded border p-4">
			<div class="flex flex-col items-center justify-center">
				<div class="text-sm">{pluralize(enrollments.data.length, "student", "students")}</div>
				<div class="text-xl">{enrollments.data.length}</div>
			</div>

			<div class="row-span-2 flex flex-col items-center justify-center gap-1">
				<div class="text-center">
					<div class="text-sm">overall</div>
				</div>
				<div class="text-3xl">
					{cutePercent(safeDivision(totalPeriodEvents - totalAbsents, totalPeriodEvents) * 100)} %
				</div>
				<div class="text-sm">attendance</div>
			</div>

			<div class="flex flex-col items-center justify-center">
				<div class="text-sm">{pluralize(subject.data.representatives.length, "rep", "reps")}</div>
				<div class="text-xl">{subject.data.representatives.length}</div>
			</div>

			<div class="flex flex-col items-center justify-center">
				<div class="text-sm">
					{pluralize(Number(subject.data.periodCount) || 0, "period", "periods")}
				</div>
				<div class="text-xl">{subject.data.periodCount}</div>
			</div>

			<div class="flex flex-col items-center justify-center">
				<div class="text-sm">{pluralize(totalAbsents, "absent", "absents")}</div>
				<div class="text-xl">{totalAbsents}</div>
			</div>
		</div>

		<p>Use the actions button to manage the representative role, or delist the student.</p>

		{#if enrollments.data.length > 0}
			<EnrollmentTable bind:subject={subject.data} enrollments={enrollments.data} />
		{:else}
			<div
				class="flex w-full flex-col items-center justify-center gap-2 rounded border border-dashed p-4 text-muted-foreground"
			>
				<SquareUserRound class="size-5" />
				<div class="text-sm">There are no students enrolled to the subject.</div>
				<button
					onclick={() => (showEnrollmentManageDialog = true)}
					class="flex place-items-center items-center justify-center gap-x-2 rounded border px-3 py-1"
				>
					<UserRoundPlusIcon class="size-3" />
					<div class="text-sm">Add students</div>
				</button>
			</div>
		{/if}
	{:else if enrollments.state === "failed"}
		<LoadingFailedCard>
			<div>{enrollments.message}</div>
		</LoadingFailedCard>
	{:else}
		<div>Unknown action.</div>
	{/if}
{:else if subject.state === "failed"}
	<LoadingFailedCard>
		<div>{subject.message}</div>
	</LoadingFailedCard>
{:else}
	<div>Unknown action.</div>
{/if}
