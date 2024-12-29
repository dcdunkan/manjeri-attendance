<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import { Button } from "$lib/components/ui/button";
	import { ListPlusIcon, ListRestartIcon } from "lucide-svelte";
	import BatchTable from "./batch-table.svelte";

	export let data;
</script>

<NavigationHeader title="Batches" />

<p>
	Batches and subjects can be created or updated through here. Click one of the batches to modify
	the subject list and other details of the batch.
</p>

<div class="flex place-items-center justify-between">
	<div class="text-2xl font-bold">Registered batches</div>
	<div class="flex gap-2">
		<Button variant="outline" class="aspect-square"><ListRestartIcon /></Button>
		<a href="batches/new"> <Button variant="default"><ListPlusIcon /> Add batch</Button></a>
	</div>
</div>

{#if data.batches.length > 0}
	<BatchTable batches={data.batches} />
{:else}
	<div
		class="flex place-items-center justify-center border-2 border-dashed bg-primary-foreground p-6"
	>
		<div class="text-center text-sm">
			<p>No batches are registered yet.</p>
			<p>Click "Add batch" to register a batch.</p>
		</div>
	</div>
{/if}
