<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import StudentForm from "./student-form.svelte";
	import type { PageData } from "./$types";
	import DataLoader from "$lib/components/data-loader.svelte";

	let { data }: { data: PageData } = $props();
</script>

<NavigationHeader title="New Student" />

<div class="text-2xl">Register Student</div>

<p>Fill the details to register a new student to the batch.</p>

<DataLoader promise={data.result}
	>{#snippet loadingMessage()}
		<div>Getting batch details...</div>
	{/snippet}

	{#snippet errorMessage()}
		<div>Failed to load batch details.</div>
	{/snippet}

	{#snippet showData([form, batch]: Awaited<typeof data.result>)}
		{#if batch == null}
			{@render errorMessage(null)}
		{:else}
			<StudentForm {form} {batch} />
		{/if}
	{/snippet}</DataLoader
>
