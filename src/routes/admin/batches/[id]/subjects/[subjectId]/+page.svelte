<script lang="ts">
	import DataLoader from "$lib/components/data-loader.svelte";
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import { EditIcon } from "lucide-svelte";
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

	let showEditDialog = $state(false);
</script>

<NavigationHeader title="Details" />

{#if subject.state === "pending"}
	<LoadingCard><div>{subject.message}</div></LoadingCard>
{:else if subject.state === "resolved"}
	<div class="flex place-items-center justify-between">
		<h1 class="text-2xl">{subject.data.name}</h1>
		<Button variant="outline" onclick={() => (showEditDialog = true)}><EditIcon /> Edit</Button>
	</div>

	<EditSubjectDialog bind:open={showEditDialog} bind:subject={subject.data} />

	{#if enrollments.state === "pending"}
		<LoadingCard><div>{enrollments.message}</div></LoadingCard>
	{:else if enrollments.state === "resolved"}
		<p>Use the actions button to manage the representative role, or delist the student.</p>

		<EnrollmentTable subject={subject.data} enrollments={enrollments.data} />
	{:else if enrollments.state === "failed"}
		<LoadingFailedCard><div>{enrollments.message}</div></LoadingFailedCard>
	{:else}
		<div>Unknown action.</div>
	{/if}
{:else if subject.state === "failed"}
	<LoadingFailedCard><div>{subject.message}</div></LoadingFailedCard>
{:else}
	<div>Unknown action.</div>
{/if}
