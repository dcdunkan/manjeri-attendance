<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import { Button } from "$lib/components/ui/button";
	import { ListPlusIcon } from "lucide-svelte";
	import DataLoader from "$lib/components/data-loader.svelte";
	import EmptyInfobox from "$lib/components/empty-infobox.svelte";
	import StudentsTable from "./students-table.svelte";

	let { data } = $props();
</script>

<NavigationHeader title="Students" />

<div class="flex place-items-center justify-between">
	<div class="text-2xl font-medium">Students</div>
	<div class="flex gap-2">
		<!-- TODO: <Button variant="outline" class="aspect-square"><ListRestartIcon /></Button> -->
		<a href="students/new"> <Button variant="secondary"><ListPlusIcon /> Add student</Button></a>
	</div>
</div>

<p>Students registered in the batch are listed below.</p>

<DataLoader promise={data.students}>
	{#snippet loadingMessage()}
		<div>Loading...</div>
	{/snippet}

	{#snippet showData(students: Awaited<typeof data.students>)}
		{#if students.length > 0}
			<StudentsTable {students} />
		{:else}
			<EmptyInfobox>
				<p>No students are registered yet in the batch.</p>
				<p>Click "Add student" to register a student.</p>
			</EmptyInfobox>
		{/if}
	{/snippet}

	{#snippet errorMessage()}
		<div>Failed to load student list.</div>
	{/snippet}
</DataLoader>
