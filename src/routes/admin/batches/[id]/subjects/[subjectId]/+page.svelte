<script lang="ts">
	import DataLoader from "$lib/components/data-loader.svelte";
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import { Button } from "$lib/components/ui/button";
	import { EditIcon } from "lucide-svelte";
	import type { PageData } from "./$types";
	import EnrollmentTable from "./enrollment-table.svelte";

	let { data }: { data: PageData } = $props();
</script>

<NavigationHeader title="Details" />

<DataLoader promise={data.details}>
	{#snippet loadingMessage()}
		<div>Loading list of enrollments...</div>
	{/snippet}

	{#snippet showData([subject, enrollments])}
		<div class="flex place-items-center justify-between">
			<h1 class="text-2xl">{subject.name}</h1>
			<Button variant="outline"><EditIcon /> Edit</Button>
		</div>
		<p>
			List of enrollments are shown below. Click the edit button to edit the subject details. You
			can use the actions button next to each enrollment in order to promote / demote the
			representative role, or delist the enrollment of the student.
		</p>
		<EnrollmentTable {subject} {enrollments} />
	{/snippet}

	{#snippet errorMessage()}
		<div>Failed to load the list of enrollments.</div>
	{/snippet}
</DataLoader>
