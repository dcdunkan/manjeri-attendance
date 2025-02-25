<script lang="ts">
	import NavigationHeader from "$lib/components/navigation-header.svelte";
	import { ArrowRightIcon, BookUserIcon, EditIcon, Icon, UserPlusIcon } from "lucide-svelte";
	import type { PageData } from "./$types";
	import { Button } from "$lib/components/ui/button";
	import EmptyInfobox from "$lib/components/empty-infobox.svelte";
	import type { LoadedData } from "$lib/types";
	import { onMount } from "svelte";
	import LoadingCard from "$lib/components/loading-card.svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";

	let { data }: { data: PageData } = $props();
	let pageTitle = $state<string>("Batch Details");

	let batch = $state<LoadedData<Awaited<typeof data.batch>>>({
		state: "pending",
		message: "Loading batch details...",
	});

	onMount(async () => {
		try {
			batch = { state: "resolved", data: await data.batch };
		} catch (err) {
			console.error(err);
			batch = { state: "failed", message: "Failed to load batch details." };
		}
	});
</script>

<NavigationHeader title={pageTitle} />

{#if batch.state === "pending"}
	<LoadingCard>{batch.message}</LoadingCard>
{:else if batch.state === "resolved"}
	{#if batch.data == null}
		<div>Batch not found.</div>
	{:else}
		<div class="flex place-items-center justify-between">
			<h1 class="text-2xl">Batch {batch.data.name}</h1>
			<Button href="{batch.data.id}/edit" variant="outline"><EditIcon /> Edit</Button>
		</div>

		<div class="flex place-items-center justify-center gap-10 rounded-lg border p-6">
			<div class="text-right">
				<div class="text-5xl">{batch.data.studentCount}</div>
				<div class="text-xl">students</div>
			</div>
			<div>|</div>
			<div class="text-left">
				<div class="text-5xl">{batch.data.subjects.length}</div>
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

				{#each [{ href: `${batch.data.id}/students/new`, icon: UserPlusIcon, title: "Register new batch student" }, { href: `${batch.data.id}/students`, icon: BookUserIcon, title: "See all registered students" }] as item}
					{@render menuitem(item)}
				{/each}
			</div>
		</div>

		<div class="space-y-4">
			<h2 class="font-serif text-2xl font-medium italic">Subjects</h2>

			<p>Select a subject to see students enrolled, attendance statistics and manage statistics.</p>

			<div class="space-y-2">
				{#each batch.data.subjects as subject, i}
					<a
						class="flex w-full cursor-pointer place-items-center gap-2 rounded py-3"
						href="{subject.batchId}/subjects/{subject.id}"
					>
						<div class="ml-2 text-right font-mono">
							{(i + 1).toString().padStart(batch.data.subjects.length.toString().length, "0")}&rpar;
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
{:else if batch.state === "failed"}
	<LoadingFailedCard>{batch.message}</LoadingFailedCard>
{:else}
	<LoadingFailedCard>Unknown action.</LoadingFailedCard>
{/if}
