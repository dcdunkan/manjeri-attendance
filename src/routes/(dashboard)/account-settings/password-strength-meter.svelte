<script lang="ts">
	import clsx from "clsx";
	import zxcvbn from "zxcvbn";

	let { password = "" }: { password: string } = $props();

	const MAX_STRENGTH = 5;
	let strength = $derived(zxcvbn(password).score + 1);

	const COLOR_LEVELS = [
		"bg-red-600",
		"bg-orange-600",
		"bg-yellow-600",
		"bg-lime-600",
		"bg-green-600",
	];
</script>

<div class="grid grid-cols-5 gap-2">
	{#each { length: strength }}
		<div class={clsx("h-1 rounded", COLOR_LEVELS[strength - 1])}></div>
	{/each}
	{#each { length: MAX_STRENGTH - strength }}
		<div class="h-1 rounded bg-secondary"></div>
	{/each}
</div>
