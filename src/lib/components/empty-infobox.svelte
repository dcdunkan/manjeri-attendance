<script lang="ts">
	import type { Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();
</script>

<div
	class="flex place-items-center justify-center rounded border-2 border-dashed p-6 text-muted-foreground"
>
	<div class="text-center text-base">
		{@render children()}
	</div>
</div>
