<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import StudentForm from "./student-form.svelte";
	import type { PageData } from "./$types";
	import type { LoadedData } from "$lib/types";
	import { onMount } from "svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";
	import LoadingCard from "$lib/components/loading-card.svelte";

	let { data }: { data: PageData } = $props();

	let result = $state<LoadedData<Awaited<typeof data.result>>>({
		state: "pending",
		message: "Getting batch details...",
	});
	onMount(async () => {
		try {
			result = { state: "resolved", data: await data.result };
		} catch (err) {
			console.error(err);
			result = { state: "failed", message: "Failed to load batch details." };
		}
	});
</script>

<NavigationHeader title="New Student" />

<div class="text-2xl">Register Student</div>

<p>Fill the details to register a new student to the batch.</p>

{#if result.state === "pending"}
	<LoadingCard>{result.message}</LoadingCard>
{:else if result.state === "resolved"}
	{#if result.data[1] == null}
		<LoadingFailedCard>Could not get batch details.</LoadingFailedCard>
	{:else}
		<StudentForm form={result.data[0]} batch={result.data[1]} />
	{/if}
{:else if result.state === "failed"}
	<LoadingFailedCard>
		{result.message}
	</LoadingFailedCard>
{:else}
	<LoadingFailedCard>Unknown action.</LoadingFailedCard>
{/if}
