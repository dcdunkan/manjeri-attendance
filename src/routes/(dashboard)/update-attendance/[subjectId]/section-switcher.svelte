<script lang="ts">
	import * as Popover from "$lib/components/ui/popover";
	import { CheckIcon, ChevronDownIcon } from "lucide-svelte";
	import { type Section, sections } from "./types";

	let {
		currentSection,
		onSelection,
	}: {
		currentSection: Section;
		onSelection: (section: Section) => void;
	} = $props();
</script>

<Popover.Root>
	<Popover.Trigger>
		<div class="flex place-items-center gap-2 rounded px-3 py-2 hover:bg-primary/10">
			<div>{currentSection === sections.history ? "History" : "Overview"}</div>
			<ChevronDownIcon class="size-4" />
		</div>
	</Popover.Trigger>
	<Popover.Content align="start" class="w-auto p-1">
		<div>
			{#each Object.values(sections) as section}
				<button
					tabindex="-1"
					onclick={() => onSelection(section)}
					class="flex w-full place-items-center rounded-sm px-4 py-2 text-left transition-all duration-100 hover:bg-primary/10"
				>
					<div class="flex aspect-square size-8 place-items-center">
						{#if section.id === currentSection.id}
							<CheckIcon class="size-5" />
						{/if}
					</div>
					<div>
						<div>{section.label}</div>
						<div class="text-sm font-light text-primary/80">
							{section.description}
						</div>
					</div>
				</button>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
