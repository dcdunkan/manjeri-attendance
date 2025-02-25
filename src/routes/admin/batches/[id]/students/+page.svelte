<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import { Button } from "$lib/components/ui/button";
	import { ListPlusIcon } from "lucide-svelte";
	import EmptyInfobox from "$lib/components/empty-infobox.svelte";
	import StudentsTable from "./students-table.svelte";
	import { onMount } from "svelte";
	import type { LoadedData } from "$lib/types";
	import LoadingCard from "$lib/components/loading-card.svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";

	let { data } = $props();

	let students = $state<LoadedData<Awaited<typeof data.students>>>({
		state: "pending",
		message: "Loading student list...",
	});

	onMount(async () => {
		try {
			students = { state: "resolved", data: await data.students };
		} catch (err) {
			console.error(err);
			students = { state: "failed", message: "Failed to load student list." };
		}
	});
</script>

<NavigationHeader title="Students" />

<div class="flex place-items-center justify-between">
	<div class="text-2xl">Students</div>
	<div class="flex gap-2">
		<!-- TODO: <Button variant="outline" class="aspect-square"><ListRestartIcon /></Button> -->
		<a href="students/new"> <Button variant="secondary"><ListPlusIcon /> Add student</Button></a>
	</div>
</div>

<p>Students registered in the batch are listed below.</p>

{#if students.state === "pending"}
	<LoadingCard>{students.message}</LoadingCard>
{:else if students.state === "resolved"}
	{#if students.data.length > 0}
		<StudentsTable students={students.data} />
	{:else}
		<EmptyInfobox>
			<p>No students are registered yet in the batch.</p>
			<p>Click "Add student" to register a student.</p>
		</EmptyInfobox>
	{/if}
{:else if students.state === "failed"}
	<LoadingFailedCard>{students.message}</LoadingFailedCard>
{:else}
	<LoadingFailedCard>Unknown action</LoadingFailedCard>
{/if}
