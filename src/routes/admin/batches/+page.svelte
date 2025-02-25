<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import { Button } from "$lib/components/ui/button";
	import { ListPlusIcon } from "lucide-svelte";
	import BatchTable from "./batch-table.svelte";
	import EmptyInfobox from "$lib/components/empty-infobox.svelte";
	import type { LoadedData } from "$lib/types";
	import { onMount } from "svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";
	import LoadingCard from "$lib/components/loading-card.svelte";

	let { data } = $props();

	let batches = $state<LoadedData<Awaited<typeof data.batches>>>({
		state: "pending",
		message: "Loading batches...",
	});
	onMount(async () => {
		try {
			batches = { state: "resolved", data: await data.batches };
		} catch (err) {
			console.error(err);
			batches = { state: "failed", message: "Failed to load batches." };
		}
	});
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

{#if batches.state === "pending"}
	<LoadingCard>
		{batches.message}
	</LoadingCard>
{:else if batches.state === "resolved"}
	{#if batches.data.length > 0}
		<BatchTable batches={batches.data} />
	{:else}
		<EmptyInfobox>
			<p>No batches are registered yet.</p>
			<p>Click "Add batch" to register a batch.</p>
		</EmptyInfobox>
	{/if}
{:else if batches.state === "failed"}
	<LoadingFailedCard>
		{batches.message}
	</LoadingFailedCard>
{:else}
	<LoadingFailedCard>Unknown action.</LoadingFailedCard>
{/if}
