<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import { ArrowRightIcon, BookUserIcon, EditIcon, Icon, UserPlusIcon } from "lucide-svelte";
	import type { PageData } from "./$types";
	import { Button } from "$lib/components/ui/button";
	import DataLoader from "$lib/components/data-loader.svelte";
	import EmptyInfobox from "$lib/components/empty-infobox.svelte";

	let { data }: { data: PageData } = $props();
	let pageTitle = $state<string>("Batch Details");
</script>

<NavigationHeader title={pageTitle} />

<DataLoader promise={data.batch}>
	{#snippet loadingMessage()}
		<div>Loading batch details...</div>
	{/snippet}

	{#snippet showData(batch: Awaited<typeof data.batch>)}
		{#if batch == null}
			<div>Batch not found.</div>
		{:else}
			<div class="flex place-items-center justify-between">
				<h1 class="text-2xl">Batch {batch.name}</h1>
				<a href="{batch.id}/edit"><Button variant="outline"><EditIcon /> Edit</Button></a>
			</div>

			<div class="flex place-items-center justify-center gap-10 rounded-lg border p-6">
				<div class="text-right">
					<div class="text-5xl">{batch.studentCount}</div>
					<div class="text-xl">students</div>
				</div>
				<div>|</div>
				<div class="text-left">
					<div class="text-5xl">{batch.subjects.length}</div>
					<div class="text-xl">subjects</div>
				</div>
			</div>

			<div class="space-y-4">
				<h2 class="font-serif text-2xl font-medium italic">Students</h2>

				<div class="space-y-2">
					{#snippet menuitem(props: { href: string; icon: typeof Icon; title: string })}
						<a
							href={props.href}
							class="flex w-full cursor-pointer place-items-center gap-2 rounded py-3"
						>
							<props.icon class="ml-2 size-6" />
							<div class="ml-6 flex-grow">{props.title}</div>
							<ArrowRightIcon />
						</a>
					{/snippet}

					{#each [{ href: `${batch.id}/students/new`, icon: UserPlusIcon, title: "Register new batch student" }, { href: `${batch.id}/students`, icon: BookUserIcon, title: "See all registered students" }] as item}
						{@render menuitem(item)}
					{/each}
				</div>
			</div>

			<div class="space-y-4">
				<h2 class="font-serif text-2xl font-medium italic">Subjects</h2>

				<p>
					Subjects linked with the subjects are listed below. Select a subject to see students
					enrolled, representatives and attendance statistics.
				</p>

				<div class="space-y-2">
					{#each batch.subjects as subject, i}
						<a
							class="flex w-full cursor-pointer place-items-center gap-2 rounded py-3"
							href="{subject.batchId}/subjects/{subject.id}"
						>
							<div class="ml-2 text-right font-mono">
								{(i + 1).toString().padStart(batch.subjects.length.toString().length, "0")}&rpar;
							</div>
							<div class="ml-6 flex-grow">{subject.name}</div>
							<div><ArrowRightIcon /></div>
						</a>
					{:else}
						<EmptyInfobox>
							<p>No subjects have been added to the batch.</p>
							<p>Edit the batch to add subjects.</p>
						</EmptyInfobox>
					{/each}
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet errorMessage()}
		<div>Failed to load batch information.</div>
	{/snippet}
</DataLoader>
