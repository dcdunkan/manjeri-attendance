<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import type { PageData } from "./$types";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";
	import StudentInfo from "./student-info.svelte";
	import type { LoadedData } from "$lib/types";
	import { onMount } from "svelte";
	import LoadingCard from "$lib/components/loading-card.svelte";

	let { data }: { data: PageData } = $props();

	let student = $state<LoadedData<Awaited<typeof data.student>>>({
		state: "pending",
		message: "Loading student details...",
	});

	onMount(async () => {
		try {
			student = { state: "resolved", data: await data.student };
		} catch (err) {
			console.error(err);
			student = { state: "failed", message: "Failed to load student details." };
		}
	});
</script>

<NavigationHeader title="Student Details" />

{#if student.state === "pending"}
	<LoadingCard>{student.message}</LoadingCard>
{:else if student.state === "resolved"}
	{#if student.data == null}
		<LoadingFailedCard>
			<div>Couldn't find student with the ID you're looking for.</div>
		</LoadingFailedCard>
	{:else}
		<div class="space-y-6">
			<StudentInfo student={student.data} />
		</div>
	{/if}
{:else if student.state === "failed"}
	<LoadingFailedCard>{student.message}</LoadingFailedCard>
{:else}
	<LoadingFailedCard>Unknown action.</LoadingFailedCard>
{/if}
