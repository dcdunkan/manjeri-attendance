<script lang="ts">
	import * as Breadcrumb from "$lib/components/ui/breadcrumb";

	import { page } from "$app/state";
	import { ArrowLeftIcon } from "lucide-svelte";
	import { MediaQuery } from "svelte/reactivity";

	const segments = page.url.pathname
		.split("/")
		.map((segment) => segment.trim())
		.filter((segment) => segment.length > 0);

	const SEGMENT_TITLES: Record<string, string> = {
		admin: "Dashboard",
		batches: "Batches",
		students: "Students",
		representatives: "Representatives",
	};

	let { title }: { title: string } = $props();

	const isShowable = new MediaQuery("(min-width: 768px)", true);
</script>

{#if !isShowable.current}
	{#snippet segment()}
		<div class="flex place-items-center gap-3 text-sm">
			{#if segments.length > 1}
				<ArrowLeftIcon class="size-4" />
			{/if}
			<div class="font-normal text-foreground">{title}</div>
		</div>
	{/snippet}

	{#if segments.length > 1}
		<a href="/{segments.slice(0, segments.length - 1).join('/')}">
			{@render segment()}
		</a>
	{:else}
		{@render segment()}
	{/if}
{:else if segments.length >= 1}
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<!-- TODO: slice segments into last X ones. -->
			{#each segments as segment, i (i)}
				{#if i === segments.length - 1}
					<Breadcrumb.Item>
						<Breadcrumb.Page>{title}</Breadcrumb.Page>
					</Breadcrumb.Item>
				{:else}
					<Breadcrumb.Item class="hidden md:block">
						<Breadcrumb.Link href="/{segments.slice(0, i + 1).join('/')}"
							>{SEGMENT_TITLES[segment]}</Breadcrumb.Link
						>
					</Breadcrumb.Item>
					<Breadcrumb.Separator class="hidden md:block" />
				{/if}
			{/each}
		</Breadcrumb.List>
	</Breadcrumb.Root>
{/if}

<!-- TODO: shrink navigation header -->
