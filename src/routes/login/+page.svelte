<script lang="ts">
	import { mode } from "mode-watcher";
	import type { PageProps } from "./$types";
	import LoginForm from "./login-form.svelte";

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Login | Dactylo</title>
</svelte:head>

<div class="space-y-8">
	<div class="mx-auto flex max-w-sm place-content-center">
		{#if $mode === "light"}
			<img alt="Dactylo logo" src="/images/dactylo-dark.png" class="w-3/5" />
		{:else}
			<img alt="Dactylo logo" src="/images/dactylo-light.png" class="w-3/5" />
		{/if}
	</div>

	<LoginForm data={data.form} />

	<div class="mx-auto flex max-w-sm place-content-center">
		{#if $mode === "light"}
			<img alt="Inara logo" src="/images/inara-dark.png" class="w-2/5" />
		{:else}
			<img alt="Inara logo" src="/images/inara-light.png" class="w-2/5" />
		{/if}
	</div>
</div>
