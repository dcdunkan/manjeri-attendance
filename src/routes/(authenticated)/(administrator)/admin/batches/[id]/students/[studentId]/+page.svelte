<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import type { PageData } from "./$types";
	import DataLoader from "$lib/components/data-loader.svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";
	import StudentInfo from "./student-info.svelte";

	let { data }: { data: PageData } = $props();
</script>

<NavigationHeader title="Student Details" />

<DataLoader promise={data.student}>
	{#snippet loadingMessage()}
		<div>Getting student details...</div>
	{/snippet}

	{#snippet errorMessage()}
		<div>Failed to load the student details.</div>
	{/snippet}

	{#snippet showData(student: Awaited<typeof data.student>)}
		{#if student == null}
			<LoadingFailedCard>
				<div>Couldn't find student with the ID you're looking for.</div>
			</LoadingFailedCard>
		{:else}
			<div class="space-y-6">
				<StudentInfo {student} />
			</div>
		{/if}
	{/snippet}
</DataLoader>
