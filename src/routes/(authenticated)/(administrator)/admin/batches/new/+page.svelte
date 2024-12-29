<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import BatchForm from "./batch-form.svelte";
	import type { PageData } from "./$types.js";

	export let data: PageData;
</script>

<NavigationHeader title="New Batch" />

<div class="text-2xl">Register batch</div>

<p>Fill the details to register a new batch.</p>

<BatchForm data={data.form} />
