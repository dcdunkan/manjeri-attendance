<script lang="ts">
	import {
		ArrowLeftIcon,
		ArrowRightIcon,
		CalendarDaysIcon,
		CheckCircleIcon,
		ListIcon,
		LoaderCircleIcon,
	} from "lucide-svelte";
	import type { PageData } from "./$types";
	import clsx from "clsx";
	import { SvelteDate, SvelteMap } from "svelte/reactivity";
	import { cutePercent, extractBaseDate, pluralize, safeDivision } from "$lib/helpers";
	import { MONTHS } from "$lib/constants";
	import { CalendarDate, GregorianCalendar, getDayOfWeek } from "@internationalized/date";
	import Button from "$lib/components/ui/button/button.svelte";
	import type { LoadedData, Result, Data, AwaitReturn } from "$lib/types";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Table from "$lib/components/ui/table";
	import type { getEnrolledSubjects } from "$lib/server/db/enrollments";
	import LoadingCard from "$lib/components/loading-card.svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";
	import { slide } from "svelte/transition";

	let { data }: { data: PageData } = $props();

	const views = {
		calendar: { title: "Date-wise Attendance", icon: CalendarDaysIcon },
		subject: { title: "Subject-wise Attendance", icon: ListIcon },
	};
	let currentView = $state<keyof typeof views>();
	let FALLBACK_VIEW: keyof typeof views = "calendar";
	const LOCAL_STORAGE_KEY_VIEW = "attendance-view-pref";
	function isView(view: string | null): view is keyof typeof views {
		return view != null && Object.keys(views).includes(view);
	}

	const calendar = new GregorianCalendar();
	const selectedDate = new SvelteDate();
	const selected = $derived(extractBaseDate(selectedDate));
	const calendarDate = $derived.by(() => {
		return new CalendarDate(selected.year, selected.month + 1, selected.date);
	});
	const numberOfDays = $derived(calendar.getDaysInMonth(calendarDate));
	const startOffset = $derived.by(() => {
		const lastMonth = calendarDate.subtract({ months: 1 });
		const lastDay = lastMonth.set({ day: calendar.getDaysInMonth(lastMonth) });
		return { day: lastDay.day, weekDay: getDayOfWeek(lastDay, "en-US") + 1 };
	});
	const restOfTheDays = $derived(7 - ((startOffset.weekDay + numberOfDays) % 7));
	const monthOptions = MONTHS.map((month, i) => ({ value: String(i), label: month }));
	const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	type EnrolledSubjectMap = Record<
		number,
		AwaitReturn<typeof getEnrolledSubjects>[number]["subject"]
	>;
	let enrolledSubjects = $state<LoadedData<EnrolledSubjectMap>>({
		state: "pending",
		message: "Loading subjects...",
	});

	onMount(async () => {
		const savedViewPreference = localStorage.getItem(LOCAL_STORAGE_KEY_VIEW);
		if (!isView(savedViewPreference)) {
			localStorage.setItem(LOCAL_STORAGE_KEY_VIEW, FALLBACK_VIEW);
		} else {
			currentView = savedViewPreference;
		}

		try {
			const result = await data.subjects;
			enrolledSubjects = {
				state: "resolved",
				data: result.reduce((p, enrollment) => {
					p[enrollment.subject.id] = {
						...enrollment.subject,
						periodCount: Number(enrollment.subject.periodCount),
						absentCount: Number(enrollment.subject.absentCount),
					};
					return p;
				}, {} as EnrolledSubjectMap),
			};
		} catch (error) {
			console.error(error);
			enrolledSubjects = { state: "failed", message: "Could not get enrolled subjects" };
			toast.error("Could not get enrolled subjects");
		}
	});

	type DayData = Record<number, { subjectId: number; absent: boolean }[]>;
	const monthlyCache = new SvelteMap<`${number}-${number}`, DayData>();
	let monthlyData = $state<LoadedData<DayData>>({
		state: "pending",
		message: "Loading monthly data...",
	});
	let showDayDialog = $state(false);

	$effect(() => {
		if (enrolledSubjects.state !== "resolved") return;

		const cacheKey = `${selected.year}-${selected.month}` as const;
		const cached = monthlyCache.get(cacheKey);
		if (cached != null) {
			monthlyData = { state: "resolved", data: cached };
			return;
		}

		const sync = { selected, studentId: data.studentId, numberOfDays, cacheKey };
		(async () => {
			const loadingToast = toast.loading("Fetching from server...");
			monthlyData = { state: "pending", message: "Loading monthly data..." };

			const searchParams = new URLSearchParams({
				student: sync.studentId.toString(),
				start: Date.UTC(sync.selected.year, sync.selected.month, 1).toString(),
				end: Date.UTC(sync.selected.year, sync.selected.month, sync.numberOfDays).toString(),
				subjects: Object.keys(enrolledSubjects.data)
					.map((id) => id)
					.join(","),
			});

			const response = await fetch(`/api/student/monthly?${searchParams}`);
			if (!response.ok && response.status !== 400) {
				toast.dismiss(loadingToast);
				monthlyData = { state: "failed", message: "Failed to load monthly data" };
				return;
			}
			const result: Result<Data.MonthlyStudentPeriods> = await response.json();
			if (!result.ok) {
				toast.dismiss(loadingToast);
				monthlyData = { state: "failed", message: "Failed to load monthly data" };
				return;
			}

			const transformed = result.data
				.map((period) => {
					return {
						day: new Date(period.date).getDate(),
						absent: period.absentees.length === 1,
						subjectId: period.subjectId,
					};
				})
				.reduce<DayData>((p, period) => {
					p[period.day] ??= [];
					p[period.day].push({
						subjectId: period.subjectId,
						absent: period.absent,
					});
					return p;
				}, {});
			monthlyCache.set(sync.cacheKey, transformed);

			if (sync.selected.year === selected.year && sync.selected.month === selected.month) {
				monthlyData = { state: "resolved", data: transformed };
			}

			toast.dismiss(loadingToast);
		})();
	});

	let subjectDialog = $state<{
		show: boolean;
		subjectId: number | null;
		currentPage: number;
		totalPages: number;
	}>({ show: false, subjectId: null, currentPage: 0, totalPages: 0 });
	type Period = {
		absenteeId: number;
		periodId: number;
		date: Date;
	};
	let absentPeriods = $state<LoadedData<Period[]>>({
		state: "pending",
		message: "Loading absent periods...",
	});
	const MAX_ABSENTS_PER_PAGE = 10;
	const subjectCache = new SvelteMap<number, Period[]>();

	$effect(() => {
		if (!subjectDialog.show) return;
		if (enrolledSubjects.state !== "resolved") return;
		if (subjectDialog.subjectId == null) return;
		const subject = enrolledSubjects.data[subjectDialog.subjectId];
		// HACK: no need of "that" realtime effect, not as of now.
		if (subject.periodCount === 0 || subject.absentCount === 0) return;

		const cacheKey = subjectDialog.subjectId;
		const cached = subjectCache.get(cacheKey);
		if (cached != null) {
			absentPeriods = { state: "resolved", data: cached };
			return;
		}

		const sync = {
			cacheKey,
			subjectId: subjectDialog.subjectId,
			page: subjectDialog.currentPage,
			studentId: data.studentId,
		};

		(async () => {
			const loadingToast = toast.loading("Fetching from server...");

			absentPeriods = { state: "pending", message: "Loading absent data..." };

			const searchParams = new URLSearchParams({
				student: sync.studentId.toString(),
				subject: sync.subjectId.toString(),
				page: sync.page.toString(),
			});

			const response = await fetch(`/api/student/subject?${searchParams}`);
			if (!response.ok && response.status !== 400) {
				toast.dismiss(loadingToast);
				absentPeriods = { state: "failed", message: "Failed to load absent data" };
				return;
			}
			const result: Result<Data.SubjectAbsentPeriods> = await response.json();
			if (!result.ok) {
				toast.dismiss(loadingToast);
				absentPeriods = { state: "failed", message: "Failed to load absent data" };
				return;
			}

			const transformed = result.data.map<Period>((absentee) => {
				return {
					absenteeId: absentee.id,
					periodId: absentee.period.id,
					date: new Date(absentee.period.date),
				};
			});
			subjectCache.set(sync.cacheKey, transformed);

			if (sync.subjectId === subjectDialog.subjectId) {
				absentPeriods = { state: "resolved", data: transformed };
			}

			toast.dismiss(loadingToast);
		})();
	});

	const formatter = new Intl.DateTimeFormat("en-US", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
	const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
		weekday: "short",
	});
</script>

<div class="flex place-items-center justify-between">
	<h1 class="text-2xl">
		{#if currentView == null}
			Loading...
		{:else}
			{views[currentView].title}
		{/if}
	</h1>

	<div class="flex w-fit rounded border">
		{#each Object.entries(views) as [viewId, details]}
			<button
				onclick={() => {
					if (isView(viewId)) {
						currentView = viewId;
						localStorage.setItem(LOCAL_STORAGE_KEY_VIEW, viewId);
					}
				}}
				class={clsx(
					"bg-background p-2 text-primary first:rounded-l last:rounded-r",
					viewId === currentView && "bg-primary",
				)}
			>
				<details.icon class={clsx("size-5", viewId === currentView && "text-background")} />
			</button>
		{/each}
	</div>
</div>

{#if enrolledSubjects.state === "resolved"}
	<Dialog.Root bind:open={showDayDialog}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>
					{new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(selectedDate)}
				</Dialog.Title>
				<Dialog.Description>
					{new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(selectedDate)}
				</Dialog.Description>
			</Dialog.Header>

			{#if monthlyData.state === "resolved"}
				{@const periods = monthlyData.data[selected.date] ?? []}
				{#if periods.length === 0}
					<div
						class="flex w-full flex-col items-center justify-center gap-4 rounded border p-6 text-sm"
					>
						<CalendarDaysIcon class="block size-5" />
						<div>No periods have been recorded on this day.</div>
					</div>
				{:else}
					<div>
						{periods.length}
						{pluralize(periods.length, "period", "periods")} were recorded on this day:
					</div>

					<div class="space-y-2">
						{#each periods as period}
							<div
								class={clsx("rounded-sm px-4 py-1", period.absent ? "bg-red-600" : "bg-green-600")}
							>
								{enrolledSubjects.data[period.subjectId].name}
							</div>
						{/each}
					</div>

					<div class="flex place-items-center items-center justify-center gap-2 text-xs">
						<div class="aspect-square size-2 rounded-full bg-green-600"></div>
						<div>Present periods</div>
						<div class="aspect-square size-2 rounded-full bg-red-600"></div>
						<div>Absent periods</div>
					</div>
				{/if}
			{:else}
				<div
					class="flex w-full flex-col items-center justify-center gap-4 rounded border p-6 text-sm"
				>
					<CalendarDaysIcon class="block size-5" />
					<div>{monthlyData.message}</div>
				</div>
			{/if}

			<Dialog.Footer>
				<Button variant="secondary" onclick={() => (showDayDialog = false)}>Close</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={subjectDialog.show}>
		<Dialog.Content class="flex h-[80vh] flex-col">
			{#if subjectDialog.subjectId == null}
				<div>Not found.</div>
			{:else}
				{@const subject = enrolledSubjects.data[subjectDialog.subjectId]}
				<Dialog.Header>
					<Dialog.Title>{subject.name}: Absent periods</Dialog.Title>
					<Dialog.Description>
						Showing page of {subjectDialog.currentPage} of {subjectDialog.totalPages}
					</Dialog.Description>
				</Dialog.Header>

				<div class="flex-grow overflow-y-scroll rounded border">
					{#if subject.periodCount === 0}
						<div class="flex h-full flex-col items-center justify-center gap-4 p-6">
							<div class="text-sm">No periods were recorded.</div>
						</div>
					{:else if subject.absentCount === 0}
						<div class="flex h-full flex-col items-center justify-center gap-4 p-6">
							<CheckCircleIcon class="text-green-500" />
							<div class="text-sm">You were not absent on any periods.</div>
						</div>
					{:else if absentPeriods.state === "pending"}
						<div class="flex h-full flex-col items-center justify-center gap-4 p-6">
							<LoadingCard>
								<div>{absentPeriods.message}</div>
							</LoadingCard>
						</div>
					{:else if absentPeriods.state === "resolved"}
						<Table.Root>
							<Table.Body>
								{#each absentPeriods.data.slice() as absentPeriod, i}
									<Table.Row>
										<Table.Cell class="text-center">{i + 1}</Table.Cell>
										<Table.Cell>{formatter.format(absentPeriod.date)}</Table.Cell>
										<Table.Cell class="text-center">
											{weekdayFormatter.format(absentPeriod.date)}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					{:else if absentPeriods.state === "failed"}
						<div class="flex h-full flex-col items-center justify-center gap-4 p-6">
							<LoadingFailedCard>
								<div>{absentPeriods.message}</div>
							</LoadingFailedCard>
						</div>
					{:else}
						<div>Unknown action.</div>
					{/if}
				</div>

				<Dialog.Footer>
					<Button variant="secondary" onclick={() => (subjectDialog.show = false)}>Close</Button>
				</Dialog.Footer>

				<!-- <div class="flex justify-between">
				<Button variant="secondary" onclick={() => (subjectDialog.show = false)}>Close</Button>

				<div class="flex place-items-center gap-4">
						<Button
							variant="outline"
							onclick={() => {
								if (subjectDialog.currentPage - 1 > 0) {
									subjectDialog.currentPage -= 1;
								}
							}}
							disabled={subjectDialog.currentPage <= 1}
						>
							<ArrowLeftIcon />
						</Button>
						<div>Page {subjectDialog.currentPage} of {subjectDialog.totalPages}</div>
						<Button
							variant="outline"
							onclick={() => {
								if (subjectDialog.currentPage < subjectDialog.totalPages) {
									subjectDialog.currentPage += 1;
								}
							}}
							disabled={subjectDialog.currentPage >= subjectDialog.totalPages}
						>
							<ArrowRightIcon />
						</Button>
					</div>
				</div> -->
			{/if}
		</Dialog.Content>
	</Dialog.Root>
{/if}

{#if currentView === "calendar"}
	{@const total =
		monthlyData.state === "resolved"
			? Object.values(monthlyData.data).reduce(
					(p, c) => {
						return {
							periodCount: p.periodCount + c.length,
							absentCount: p.absentCount + c.reduce((x, y) => x + (y.absent ? 1 : 0), 0),
						};
					},
					{ periodCount: 0, absentCount: 0 },
				)
			: { periodCount: null, absentCount: null }}
	<div class="space-y-6" transition:slide>
		<div class="grid grid-cols-3 gap-4 rounded border p-4">
			<div class="flex flex-col items-center justify-center">
				<div class="text-sm">{pluralize(total.periodCount || 0, "period", "periods")}</div>
				<div class="text-xl">
					{#if total.periodCount == null}
						<LoaderCircleIcon class="size-7 animate-spin" />
					{:else}
						{total.periodCount}
					{/if}
				</div>
			</div>

			<div class="flex flex-col items-center justify-center">
				<div class="text-sm">{selected.year}</div>
				<div class="text-xl">{monthOptions[selected.month].label}</div>
			</div>

			<div class="flex flex-col items-center justify-center">
				<div class="text-sm">{pluralize(total.absentCount || 0, "absent", "absents")}</div>

				<div class="text-xl">
					{#if total.absentCount == null}
						<LoaderCircleIcon class="size-7 animate-spin" />
					{:else}
						{total.absentCount}
					{/if}
				</div>
			</div>
		</div>

		<p>Click on a day to see the recorded periods you missed.</p>

		<div class="space-y-6 rounded border">
			<div class="w-full border-b">
				<div class="flex place-items-center justify-between gap-2 p-2">
					<Button variant="ghost" onclick={() => selectedDate.setMonth(selected.month - 1)}>
						<ArrowLeftIcon class="size-3" />
					</Button>

					<div class="text-sm">{monthOptions[selected.month].label} {selected.year}</div>

					<Button variant="ghost" onclick={() => selectedDate.setMonth(selected.month + 1)}>
						<ArrowRightIcon class="size-3" />
					</Button>
				</div>
			</div>

			<div
				id="calendar"
				class="grid grid-cols-7 gap-1 *:flex *:flex-col *:items-center *:justify-center"
			>
				{#each { length: 7 }, i}
					<div class="text-[0.65rem]">{weekdays[i]}</div>
				{/each}

				{#each { length: startOffset.weekDay % 7 }, i}
					<div
						class={clsx("p-3 text-sm", i === 0 ? "text-yellow-500/60" : "text-muted-foreground")}
					>
						<div>{startOffset.day - startOffset.weekDay + i + 1}</div>
						<div class="mt-1 grid grid-cols-3 gap-1">
							{#each { length: 6 }}
								<div class="size-1 rounded-full"></div>
							{/each}
						</div>
					</div>
				{/each}

				{#each { length: numberOfDays }, i}
					{@const day = i + 1}
					{@const periods = monthlyData.state === "resolved" ? (monthlyData.data[day] ?? []) : []}
					<button
						class="rounded border border-transparent p-2 text-sm transition-all duration-100 hover:border-primary"
						onclick={() => {
							if (showDayDialog) return;
							showDayDialog = true;
							selectedDate.setDate(day);
						}}
					>
						<div class={clsx((startOffset.weekDay + i) % 7 === 0 ? "text-yellow-500" : "")}>
							{day}
						</div>
						<div class="mt-1 grid grid-cols-3 gap-1">
							{#each periods as period}
								<div
									class={clsx("size-1 rounded-full", {
										"bg-green-400": !period.absent,
										"bg-red-400": period.absent,
									})}
								></div>
							{/each}
							{#each { length: 6 - periods.length }}
								<div class="size-1 rounded-full"></div>
							{/each}
						</div>
					</button>
				{/each}

				{#each { length: restOfTheDays === 7 ? 0 : restOfTheDays }, i}
					<div class="p-3 text-sm text-muted-foreground">
						<div>{i + 1}</div>

						<div class="mt-1 grid grid-cols-3 gap-1">
							{#each { length: 6 }}<div class="size-1 rounded-full"></div>{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div
			class="flex place-items-center items-center justify-center gap-x-4 gap-y-2 text-sm sm:flex-row"
		>
			<div class="flex place-items-center gap-2">
				<div class="aspect-square size-2 rounded-full bg-green-600"></div>
				<div>Present periods</div>
			</div>
			<div class="flex place-items-center gap-2">
				<div class="aspect-square size-2 rounded-full bg-red-600"></div>
				<div>Absent periods</div>
			</div>
			<div class="flex place-items-center gap-2">
				<div class="aspect-square h-2 w-4 rounded bg-yellow-500"></div>
				<div>Holiday</div>
			</div>
		</div>

		<p class="text-center text-sm text-muted-foreground">
			Tip:
			<button
				onclick={() => (currentView = "subject")}
				class="underline decoration-primary/50 decoration-dotted underline-offset-2"
			>
				Switch to subject-wise view
			</button>
			by clicking on <ListIcon class="inline-block size-4" />.
		</p>
	</div>
{:else if currentView === "subject"}
	<div class="space-y-6" transition:slide>
		{#if enrolledSubjects.state === "pending"}
			<LoadingCard>
				<div>{enrolledSubjects.message}</div>
			</LoadingCard>
		{:else if enrolledSubjects.state === "resolved"}
			{@const subjects = Object.values(enrolledSubjects.data)}
			{#if subjects.length > 0}
				{@const total = subjects.reduce(
					(p, c) => ({
						absentCount: p.absentCount + c.absentCount,
						periodCount: p.periodCount + c.periodCount,
					}),
					{ absentCount: 0, periodCount: 0 },
				)}

				<div class="grid grid-cols-3 gap-4 rounded border p-4">
					<div class="flex flex-col items-center justify-center">
						<div class="text-sm">{pluralize(total.periodCount, "period", "periods")}</div>
						<div class="text-xl">
							{#if total.periodCount == null}
								<LoaderCircleIcon class="size-7 animate-spin" />
							{:else}
								{total.periodCount}
							{/if}
						</div>
					</div>

					<div class="flex flex-col items-center justify-center">
						<div class="text-sm">total</div>
						<div class="text-xl">
							{cutePercent(
								safeDivision(total.periodCount - total.absentCount, total.periodCount) * 100,
							)} %
						</div>
					</div>

					<div class="flex flex-col items-center justify-center">
						<div class="text-sm">{pluralize(total.absentCount, "absent", "absents")}</div>
						<div class="text-xl">
							{#if total.absentCount == null}
								<LoaderCircleIcon class="size-7 animate-spin" />
							{:else}
								{total.absentCount}
							{/if}
						</div>
					</div>
				</div>

				<p>
					Subjects you have enrolled in are listed below. The missed periods for a subject can be
					reviewed by clicking on the subject entry.
				</p>

				<Table.Root class="text-sm">
					<Table.Header>
						<Table.Row>
							<Table.Head>#</Table.Head>
							<Table.Head>Subject</Table.Head>
							<Table.Head class="text-center">Periods</Table.Head>
							<Table.Head class="text-right">Percentage</Table.Head>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{#each subjects as subject, i}
							{@const attended = subject.periodCount - subject.absentCount}
							{@const percent = cutePercent(safeDivision(attended, subject.periodCount) * 100)}

							<Table.Row
								onclick={() => {
									subjectDialog = {
										show: true,
										subjectId: subject.id,
										currentPage: subject.absentCount === 0 ? 0 : 1,
										totalPages: Math.ceil(subject.absentCount / MAX_ABSENTS_PER_PAGE),
									};
								}}
							>
								<Table.Cell>{i + 1}</Table.Cell>
								<Table.Cell>{subject.name}</Table.Cell>
								<Table.Cell class="text-center">{attended} / {subject.periodCount}</Table.Cell>
								<Table.Cell class="text-right font-bold">
									<div data-percent={percent} style="--percent: {percent}">
										{percent} %
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<div class="flex w-full items-center justify-center rounded border border-dashed p-4">
					You have not enrolled in any subjects.
				</div>
			{/if}
		{:else if enrolledSubjects.state === "failed"}
			<LoadingFailedCard>
				<div>{enrolledSubjects.message}</div>
			</LoadingFailedCard>
		{:else}
			<div>Unknown option.</div>
		{/if}

		<p class="text-center text-sm text-muted-foreground">
			Tip:
			<button
				onclick={() => (currentView = "calendar")}
				class="underline decoration-primary/50 decoration-dotted underline-offset-2"
			>
				Switch to date-wise view
			</button>
			by clicking on <CalendarDaysIcon class="inline-block size-4" />.
		</p>
	</div>
{:else if currentView == null}{:else}
	<div>Unknown view.</div>
{/if}

<style>
	[data-percent] {
		color: hsl(var(--percent) 100% 40%) !important;
	}
</style>
