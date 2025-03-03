<script>
	let { children } = $props();

	import { page } from "$app/state";
	import { ArrowLeftIcon } from "lucide-svelte";
</script>

<div class="min-h-screen">
	<div class="mx-auto flex h-screen max-w-screen-md flex-col overflow-y-scroll">
		<div class="sticky top-0 z-10 bg-background px-6 py-4">
			<div class="flex place-items-center gap-3">
				{#if typeof page.data.backwards === "string" && page.data.backwards.length > 0}
					<a href={page.data.backwards} class="aspect-square p-1">
						<ArrowLeftIcon class="size-4" />
					</a>
				{/if}
				<h1 class="text-lg">{page.data.title}</h1>
			</div>
		</div>

		<div class="flex-grow space-y-6 p-8 pt-2">
			{@render children?.()}
		</div>
	</div>
</div>
