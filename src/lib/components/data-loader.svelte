<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import LoadingCard from "./loading-card.svelte";
	import LoadingFailedCard from "./loading-failed-card.svelte";

	interface Props<T> {
		promise: Promise<T>;
		showData: Snippet<[Awaited<T>]>;
		loadingMessage: Snippet;
		errorMessage: Snippet<[any]>;
	}
	let { promise, showData, loadingMessage, errorMessage }: Props<T> = $props();
</script>

{#await promise}
	<LoadingCard>
		{@render loadingMessage()}
	</LoadingCard>
{:then data}
	{@render showData(data)}
{:catch error}
	<LoadingFailedCard>
		{@render errorMessage(error)}
	</LoadingFailedCard>
{/await}
