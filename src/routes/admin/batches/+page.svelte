<script lang="ts">
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

<div class="flex place-items-center justify-between">
	<p>Click one of the batches to manage students and subjects of the batch.</p>
</div>

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

	<Button href="batches/new" class="w-full"><ListPlusIcon /> Add batch</Button>
{:else if batches.state === "failed"}
	<LoadingFailedCard>
		{batches.message}
	</LoadingFailedCard>
{:else}
	<LoadingFailedCard>Unknown action.</LoadingFailedCard>
{/if}
