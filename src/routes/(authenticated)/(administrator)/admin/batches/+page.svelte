<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import { Button } from "$lib/components/ui/button";
	import { ListPlusIcon } from "lucide-svelte";
	import BatchTable from "./batch-table.svelte";
	import DataLoader from "$lib/components/data-loader.svelte";
	import EmptyInfobox from "$lib/components/empty-infobox.svelte";

	let { data } = $props();
</script>

<NavigationHeader title="Batches" />

<div class="flex place-items-center justify-between">
	<div class="text-2xl font-medium">Registered batches</div>
	<div class="flex gap-2">
		<!-- TODO: <Button variant="outline" class="aspect-square"><ListRestartIcon /></Button> -->
		<a href="batches/new"> <Button variant="secondary"><ListPlusIcon /> Add batch</Button></a>
	</div>
</div>

<p>
	Batches and subjects can be created or updated through here. Click one of the batches to modify
	the subject list and other details of the batch. To register a new batch, click "Add batch".
</p>

<DataLoader promise={data.batches}>
	{#snippet loadingMessage()}
		<div>Loading...</div>
	{/snippet}

	{#snippet showData(batches: Awaited<typeof data.batches>)}
		{#if batches.length > 0}
			<BatchTable {batches} />
		{:else}
			<EmptyInfobox>
				<p>No batches are registered yet.</p>
				<p>Click "Add batch" to register a batch.</p>
			</EmptyInfobox>
		{/if}
	{/snippet}

	{#snippet errorMessage()}
		<div>Failed to load batches.</div>
	{/snippet}
</DataLoader>
