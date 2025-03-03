<script lang="ts">
	import Input from "$lib/components/ui/input/input.svelte";
	import { cn } from "$lib/utils";
	import type { WithElementRef } from "bits-ui";
	import clsx from "clsx";
	import { EyeClosedIcon, EyeIcon, EyeOffIcon } from "lucide-svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { slide } from "svelte/transition";

	let {
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		...restProps
	}: WithElementRef<Omit<HTMLInputAttributes, "type">> = $props();

	let showPassword = $state(false);
</script>

<div class={cn("relative flex w-full items-center", className)}>
	<Input
		bind:value
		type={showPassword ? "text" : "password"}
		class={clsx("py-4 pr-10", {
			"text-sm": showPassword || (!showPassword && value === ""),
			"font-mono text-lg font-bold": !showPassword && value.length,
		})}
		{...restProps}
	/>
	<button
		class="absolute right-3 top-1/2 -translate-y-1/2 transform p-0 opacity-70"
		onclick={() => (showPassword = !showPassword)}
		disabled={restProps.disabled}
	>
		{#if restProps.disabled}
			<div transition:slide>
				<EyeOffIcon class="size-4" />
			</div>
		{:else if showPassword}
			<div transition:slide>
				<EyeClosedIcon class="size-4" />
			</div>
		{:else}
			<div transition:slide>
				<EyeIcon class="size-4" />
			</div>
		{/if}
	</button>
</div>
