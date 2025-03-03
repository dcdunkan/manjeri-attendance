<script lang="ts">
	import BatchForm from "./batch-form.svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<p>Fill the details to register a new batch.</p>

<BatchForm data={data.form} />
