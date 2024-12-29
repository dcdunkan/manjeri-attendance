<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import { ChevronRightIcon, EditIcon } from "lucide-svelte";
	import type { PageData } from "./$types.js";
	import { Button } from "$lib/components/ui/button";
	import { Separator } from "$lib/components/ui/separator/index.js";

	let { data }: { data: PageData } = $props();
</script>

<NavigationHeader title="{data.batch.name}'s Details" />

<div class="flex place-items-center justify-between">
	<h1 class="text-2xl">Batch {data.batch.name}</h1>
	<a href="{data.batch.id}/edit"><Button variant="outline"><EditIcon /> Edit</Button></a>
</div>

<div
	class="flex place-items-center justify-center gap-10 rounded-lg border bg-primary-foreground p-6"
>
	<div class="text-right">
		<div class="text-5xl">{data.batch.studentCount}</div>
		<div class="text-xl">students</div>
	</div>
	<div>|</div>
	<div class="text-left">
		<div class="text-5xl">{data.batch.subjects.length}</div>
		<div class="text-xl">subjects</div>
	</div>
</div>

<p>Subjects assigned to the batch:</p>

<!-- TODO: make these subjects link to their enrollment pages -->

<div class="space-y-2">
	{#each data.batch.subjects as subject, i}
		<div class="flex w-full place-items-center gap-2 rounded border p-4">
			<div class="ml-2 text-right font-mono">
				{(i + 1).toString().padStart(data.batch.subjects.length.toString().length, "0")}
			</div>
			<div class="ml-6 flex-grow">{subject.name}</div>
			<Button variant="link"><ChevronRightIcon /></Button>
		</div>
	{/each}
</div>
