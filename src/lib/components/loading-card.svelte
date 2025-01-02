<script lang="ts">
	import { LoaderCircleIcon } from "lucide-svelte";
	import type { Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();
</script>

<div class="flex flex-col place-items-center justify-center gap-2 rounded p-10">
	<LoaderCircleIcon class="size-5 animate-spin" />
	{@render children()}
</div>
