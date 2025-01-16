<script lang="ts">
	import { ArrowRightIcon } from "lucide-svelte";
	import type { Icon } from "lucide-svelte";

	export type MenuItem = {
		path: string;
		title: string;
		description: string;
		icon: typeof Icon;
		preload?: boolean;
	};

	const { items }: { items: MenuItem[] } = $props();
</script>

<!-- this used to be a snippet -->
<div>
	{#each items as item}
		<a href={item.path} data-sveltekit-preload-data={item.preload === false ? "off" : "hover"}>
			<div
				class="flex place-items-center justify-between gap-4 border-b-2 border-transparent px-2 py-4 transition-all duration-200 hover:border-primary"
			>
				<div class="flex gap-4">
					<div class="pt-2"><item.icon /></div>
					<div>
						<div class="font-medium">{item.title}</div>
						<div class="text-sm">{item.description}</div>
					</div>
				</div>
				<div><ArrowRightIcon /></div>
			</div></a
		>
	{/each}
</div>
