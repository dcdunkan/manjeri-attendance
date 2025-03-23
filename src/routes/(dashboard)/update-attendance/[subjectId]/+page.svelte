<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import { ArrowLeftIcon, CircleXIcon, LoaderCircleIcon, PlusIcon } from "lucide-svelte";
	import type { PageData } from "./$types";
	import { onMount } from "svelte";
	import type { LoadedData, Keys } from "$lib/types";
	import SectionSwitcher from "./section-switcher.svelte";
	import { pluralize } from "$lib/helpers";
	import OverviewSection from "./overview-section.svelte";
	import HistorySection from "./history-section.svelte";
	import {
		type CacheMonthlyData,
		type EnrolledStudent,
		type Section,
		sections,
		type Subject,
	} from "./types";
	import AddPeriodDialog from "./add-period-dialog.svelte";
	import { toast } from "svelte-sonner";
	import { SvelteDate, SvelteMap } from "svelte/reactivity";
	import { slide } from "svelte/transition";
	import LoadingCard from "$lib/components/loading-card.svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";

	let { data }: { data: PageData } = $props();

	let currentSectionId = $state<Keys<typeof sections>>("history");
	let currentSection = $derived<Section>(sections[currentSectionId]);
	let students = $state<LoadedData<EnrolledStudent[]>>({
		state: "pending",
		message: "Loading students data...",
	});
	let subject = $state<LoadedData<Subject>>({
		state: "pending",
		message: "Loading subject details...",
	});
	let periodCount = $state(0);
	let studentMap = $state<Record<number, EnrolledStudent>>({});
	let filterString = $state<string>("");
	let isDrawerOpen = $state<boolean>(false);

	const selectedDate = new SvelteDate();
	const monthlyCache = new SvelteMap<`${number}-${number}`, CacheMonthlyData>();

	onMount(async () => {
		try {
			const result = await data.subject;
			subject = { state: "resolved", data: result };
			periodCount = Number(subject.data.periodCount);
			try {
				const result = await data.students;
				students = { state: "resolved", data: result.map((a) => a.student) };
				studentMap = students.data.reduce(
					(p, student) => {
						return { ...p, [student.id]: student };
					},
					{} as Record<number, EnrolledStudent>,
				);
			} catch (error) {
				console.error(error);
				subject = { state: "failed", message: "Could not get subject details" };
				toast.error("Could not get subject details");
			}
		} catch (error) {
			console.error(error);
			subject = { state: "failed", message: "Could not get student data" };
			toast.error("Could not get student data");
		}
	});
</script>

<svelte:head>
	<title>Update attendance | Dactylo</title>
</svelte:head>

<div class="sticky top-0 z-10 bg-background px-6 py-4">
	<div class="flex place-items-center gap-3">
		<a href=".." class="aspect-square p-1">
			<ArrowLeftIcon class="size-4" />
		</a>
		<h1 class="text-lg">Update Attendance</h1>
	</div>
</div>

<div class="flex h-screen flex-col space-y-6">
	<div class="flex-grow space-y-6 px-8">
		{#if subject.state === "pending"}
			<LoadingCard>
				<div>{subject.message}</div>
			</LoadingCard>
		{:else if subject.state === "resolved"}
			<h1 class="text-2xl">{subject.data.name}</h1>

			<div class="grid grid-cols-3 gap-2 *:text-center">
				<div class="card">
					<div class="text-4xl font-bold">{subject.data.enrollmentCount}</div>
					<div class="text-sm">
						{pluralize(subject.data.enrollmentCount, "student", "students")}
					</div>
				</div>
				<div class="card">
					<div class="text-4xl font-bold">{subject.data.representatives.length}</div>
					<div class="text-sm">
						{pluralize(subject.data.representatives.length, "rep", "reps")}
					</div>
				</div>
				<div class="card">
					<div class="text-4xl font-bold">{periodCount}</div>
					<div class="text-sm">{pluralize(periodCount, "period", "periods")}</div>
				</div>
			</div>

			{#if students.state === "pending"}
				<LoadingCard>{students.message}</LoadingCard>
			{:else if students.state === "resolved"}
				{#if currentSection.id === sections.history.id}
					<div transition:slide|global>
						<HistorySection
							bind:filterString
							students={students.data}
							subject={subject.data}
							bind:studentMap
							{monthlyCache}
							bind:periodCount
							{selectedDate}
						/>
					</div>
				{:else if currentSection.id === sections.overview.id}
					<div transition:slide|global>
						<OverviewSection bind:filterString {studentMap} {periodCount} />
					</div>
				{:else}
					<div>Unknown option.</div>
				{/if}

				<AddPeriodDialog
					bind:open={isDrawerOpen}
					students={students.data}
					bind:studentMap
					subject={subject.data}
					{monthlyCache}
					bind:periodCount
					{selectedDate}
				/>
			{:else if students.state === "failed"}
				<LoadingCard>{students.message}</LoadingCard>
			{:else}
				<LoadingFailedCard>Unknown option.</LoadingFailedCard>
			{/if}
		{:else if subject.state === "failed"}
			<LoadingFailedCard>
				<div>{subject.message}</div>
			</LoadingFailedCard>
		{:else}
			<LoadingFailedCard>
				<div>Unknown option.</div>
			</LoadingFailedCard>
		{/if}
	</div>

	<div
		class="sticky bottom-0 z-10 flex w-full place-items-center justify-between border-t bg-background px-2 py-2"
	>
		<SectionSwitcher {currentSection} onSelection={(section) => (currentSectionId = section.id)} />
		<Button
			disabled={students.state !== "resolved" || students.data.length === 0}
			onclick={() => {
				if (students.state === "resolved") {
					isDrawerOpen = true;
				} else if (students.state === "failed") {
					toast.error("Student details could not be fetched.");
				}
			}}
		>
			{#if students.state === "resolved"}
				<PlusIcon /> Add attendance
			{:else if students.state === "failed"}
				<CircleXIcon />
			{:else}
				<LoaderCircleIcon class="animate-spin" /> Loading
			{/if}
		</Button>
	</div>
</div>

<style>
	.card {
		user-select: none;
		cursor: pointer;
		border-radius: 0.25rem;
		border-width: 1px;
		border-color: hsl(var(--primary) / 0.15);
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
		padding: 1rem;
	}

	.card:hover {
		border-color: hsl(var(--primary) / 0.4);
		background-color: hsl(var(--primary) / 0.05);
	}
</style>
