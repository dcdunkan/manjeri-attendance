<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import BatchForm from "./batch-form.svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<NavigationHeader title="New Batch" />

<div class="text-2xl">Register Batch</div>

<p>Fill the details to register a new batch.</p>

<BatchForm data={data.form} />
