<script lang="ts">
	import type { CacheMonthlyData, EnrolledStudent, Subject } from "./types";
	import { MONTHS, STARTING_YEAR } from "$lib/constants";
	import * as Select from "$lib/components/ui/select";
	import { CalendarDate, GregorianCalendar } from "@internationalized/date";
	import { SvelteDate, SvelteMap } from "svelte/reactivity";
	import clsx from "clsx";
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import {
		ArrowLeftIcon,
		ArrowRightIcon,
		CalendarCheckIcon,
		CalendarSyncIcon,
		CheckCircleIcon,
		EditIcon,
		EllipsisVerticalIcon,
		EyeIcon,
		EyeOffIcon,
		RefreshCwIcon,
		XIcon,
	} from "lucide-svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import type { BaseDate, Data, LoadedData, Result } from "$lib/types";
	import { toast } from "svelte-sonner";
	import SearchInput from "./search-input.svelte";
	import * as Table from "$lib/components/ui/table";
	import EditPeriodDialog from "./edit-period-dialog.svelte";
	import { extractBaseDate, getWeekday, isPast, isSameDay } from "$lib/helpers";
	import DeletePeriodDialog from "./delete-period-dialog.svelte";
	import { slide } from "svelte/transition";
	import LoadingCard from "$lib/components/loading-card.svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";

	let {
		filterString = $bindable(""),
		students,
		subject,
		studentMap = $bindable(),
		monthlyCache = $bindable(),
		periodCount = $bindable(0),
		selectedDate = $bindable(),
	}: {
		filterString: string;
		subject: Subject;
		students: EnrolledStudent[];
		studentMap: Record<number, EnrolledStudent>;
		monthlyCache: SvelteMap<`${number}-${number}`, CacheMonthlyData>;
		periodCount: number;
		selectedDate: SvelteDate;
	} = $props();

	const currentDate = new Date();
	const calendar = new GregorianCalendar();
	const currentYear = currentDate.getFullYear();
	const yearOptions = Array.from({ length: currentYear - STARTING_YEAR + 1 }, (_, i) => {
		const value = String(currentYear - i);
		return { label: value, value: value };
	});
	const monthOptions = MONTHS.map((month, i) => ({ value: String(i), label: month }));

	const selected = $derived<BaseDate>(extractBaseDate(selectedDate));
	const lastDay = $derived(
		calendar.getDaysInMonth(
			new CalendarDate(calendar, selected.year, selected.month + 1, selected.date),
		),
	);

	let dayScroller: HTMLDivElement;
	$effect(() => {
		for (const child of dayScroller.children) {
			if (!(child instanceof HTMLButtonElement)) continue;
			if (child.dataset.date !== selected.date.toString()) continue;
			child.scrollIntoView({ behavior: "smooth", inline: "center" });
			break;
		}
	});

	let periods = $state<LoadedData<CacheMonthlyData[number]>>({
		state: "pending",
		message: "Loading data...",
	});
	let showEveryone = $state<boolean[]>([]);
	let isEditing = $state(false);
	let editingPeriodData = $state<LoadedData<Data.Period.Get>>({
		state: "pending",
		message: "Loading data...",
	});

	$effect(() => {
		const cacheKey = `${selected.year}-${selected.month}` as const;
		const cached = monthlyCache.get(cacheKey);
		if (cached != null) {
			const data = cached[selected.date] ?? [];
			periods = { state: "resolved", data };
			showEveryone = Array.from<boolean>({ length: data.length }).fill(false);
			return;
		}

		const sync = { selected, students, lastDay };
		(async () => {
			const toastId = toast.loading("Fetching from server");
			const searchParams = new URLSearchParams({
				subject: subject.id.toString(),
				start: Date.UTC(sync.selected.year, sync.selected.month, 1).toString(),
				end: Date.UTC(sync.selected.year, sync.selected.month, sync.lastDay).toString(),
			});
			periods = { state: "pending", message: "Loading data..." };
			const response = await fetch(`/api/representative/periods?${searchParams}`);
			if (!response.ok && response.status !== 400) {
				toast.dismiss(toastId);
				periods = { state: "failed", message: "Failed to load period data" };
				return;
			}
			const result: Result<Data.Periods.GetAll> = await response.json();
			if (!result.ok) {
				toast.dismiss(toastId);
				periods = { state: "failed", message: "Failed to load period data" };
				return;
			}

			periodCount = result.data.totalPeriods;

			const transformed = result.data.periods.reduce((month, period) => {
				const date = new Date(period.date).getDate();
				month[date] ??= [];
				month[date].push({
					id: period.id,
					absentees: period.absentees.toSorted((a, b) => {
						return studentMap[a.studentId].rollNumber - studentMap[b.studentId].rollNumber;
					}),
				});
				return month;
			}, {} as CacheMonthlyData);
			monthlyCache.set(cacheKey, transformed);

			if (isSameDay(sync.selected, selected)) {
				toast.dismiss(toastId);
				periods = {
					state: "resolved",
					data: transformed[sync.selected.date] ?? [],
				};
			}
		})();
	});

	function filterFn(student: EnrolledStudent) {
		return student.fullName.toLowerCase().includes(filterString.toLowerCase());
	}
</script>

<div class="sticky top-0 z-10 space-y-4 border-b bg-background py-6">
	<SearchInput bind:value={filterString} />

	<div class="flex w-full justify-center gap-2">
		<Select.Root
			type="single"
			value={monthOptions[selected.month].value}
			onValueChange={(value) => {
				selectedDate.setMonth(Number(value));
				if (selected.month === currentDate.getMonth()) {
					if (selected.date > currentDate.getDate()) {
						selectedDate.setDate(currentDate.getDate());
					}
				} else {
					if (selected.date > lastDay) {
						selectedDate.setDate(lastDay);
					}
				}
			}}
		>
			<Select.Trigger class="w-[180px]">
				{monthOptions[selected.month].label}
			</Select.Trigger>
			<Select.Content>
				{#each monthOptions.slice(0, selected.year === currentYear ? currentDate.getMonth() + 1 : undefined) as { value, label }}
					<Select.Item {value} {label} />
				{/each}
			</Select.Content>
		</Select.Root>

		<Select.Root
			type="single"
			value={selectedDate.getFullYear().toString()}
			onValueChange={(value) => {
				selectedDate.setFullYear(Number(value));
				if (selected.year === currentYear) {
					selectedDate.setMonth(currentDate.getMonth());
					if (selected.date > currentDate.getDate()) {
						selectedDate.setDate(currentDate.getDate());
					}
				}
			}}
			disabled={yearOptions.length <= 1}
		>
			<Select.Trigger class="w-[140px]">
				{selectedDate.getFullYear()}
			</Select.Trigger>
			<Select.Content>
				{#each yearOptions as { value, label }}
					<Select.Item {value} {label} />
				{/each}
			</Select.Content>
		</Select.Root>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger class={buttonVariants({ variant: "outline", class: "aspect-square" })}>
				<EllipsisVerticalIcon />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Item onclick={() => selectedDate.setTime(currentDate.getTime())}>
					<CalendarSyncIcon /> Show today
				</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => monthlyCache.clear()}>
					<RefreshCwIcon /> Refresh
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<div class="flex w-full place-items-center gap-4">
		<Button
			variant="outline"
			class="aspect-square rounded-full"
			disabled={selected.date === 1}
			onclick={() => {
				if (selected.date != 1) {
					selectedDate.setDate(selected.date - 1);
				}
			}}
		>
			<ArrowLeftIcon />
		</Button>

		<div
			class="no-scrollbar flex w-full snap-x snap-proximity gap-2 overflow-x-scroll"
			bind:this={dayScroller}
		>
			{#each { length: lastDay }, i}
				{@const date = i + 1}
				{@const baseDate = {
					year: selected.year,
					month: selected.month,
					date: date,
				}}
				{@const isToday = isSameDay(baseDate, currentDate)}
				{@const isFuture = !isPast(baseDate, currentDate) && !isToday}
				<button
					disabled={isFuture}
					data-date={date}
					onclick={() => selectedDate.setDate(date)}
					class={clsx(
						"group flex aspect-square snap-center flex-col place-items-center justify-center rounded border border-opacity-70 p-4 transition-all hover:border-opacity-100",
						isToday && "border-2 border-primary/25",
						isSameDay(selectedDate, { year: selected.year, month: selected.month, date: date }) &&
							"border-primary/100 border-opacity-100",
						"disabled:text-muted",
					)}
				>
					<div class="text-lg">{date.toString().padStart(2, "0")}</div>
					<div class="text-sm text-muted-foreground group-disabled:text-muted">
						{getWeekday(selected.year, selected.month, date)}
					</div>
				</button>
			{/each}
		</div>

		<Button
			variant="outline"
			class="aspect-square rounded-full"
			disabled={isSameDay(selected, currentDate) || selected.date === lastDay}
			onclick={() => {
				if (!isSameDay(selected, currentDate) && selected.date !== lastDay) {
					selectedDate.setDate(selected.date + 1);
				}
			}}
		>
			<ArrowRightIcon />
		</Button>
	</div>
</div>

<EditPeriodDialog
	bind:open={isEditing}
	bind:monthlyCache
	periodData={editingPeriodData}
	bind:studentMap
	{selectedDate}
	{students}
	{subject}
/>

<div class="mt-4">
	{#if periods.state === "pending"}
		<LoadingCard>
			<div>{periods.message}</div>
		</LoadingCard>
	{:else if periods.state === "resolved"}
		{#if students.length > 0}
			{#if periods.data.length > 0}
				<div class="space-y-6" transition:slide>
					{#each periods.data as period, i}
						<div>
							<div class="flex place-items-center justify-between">
								<div class="text-xl">Period {i + 1}</div>
								<div class="gap-2">
									<Button variant="outline" onclick={() => (showEveryone[i] = !showEveryone[i])}>
										{#if showEveryone[i]}
											<EyeIcon class="size-3" />
										{:else}
											<EyeOffIcon class="size-3" />
										{/if}
									</Button>
									<Button
										variant="secondary"
										onclick={async () => {
											if (isEditing) return;
											editingPeriodData = { state: "pending", message: "Loading latest data..." };
											isEditing = true;

											const searchParams = new URLSearchParams({
												subject: String(subject.id),
												period: String(period.id),
											});
											const response = await fetch(`/api/representative/period?${searchParams}`);
											if (!response.ok && response.status !== 400) {
												editingPeriodData = {
													state: "failed",
													message: "Failed to load period data",
												};
												return;
											}
											const result: Result<Data.Period.Get> = await response.json();
											if (!result.ok) {
												editingPeriodData = {
													state: "failed",
													message: "Failed to load period data",
												};
												return;
											}
											editingPeriodData = { state: "resolved", data: result.data };
										}}
									>
										<EditIcon class="size-3" />
									</Button>
									<DeletePeriodDialog
										{subject}
										periodId={period.id}
										{selectedDate}
										{monthlyCache}
										bind:periodCount
										bind:studentMap
									/>
								</div>
							</div>
							<div class="text-muted-foreground">
								Present:
								<span class="font-bold">{students.length - period.absentees.length}</span>, Absent:
								<span class="font-bold">{period.absentees.length}</span>
							</div>

							{#if !showEveryone[i] && period.absentees.length === 0}
								<div
									class="mt-4 flex w-full flex-col items-center space-y-3 rounded border p-6 text-sm text-muted-foreground"
								>
									<CheckCircleIcon class="text-success-foreground" />
									<div>All good, no one's absent!</div>
								</div>
							{:else}
								{@const absentees = period.absentees.map((s) => s.studentId)}
								{@const filtered = students
									.filter((student) => (showEveryone[i] ? true : absentees.includes(student.id)))
									.filter(filterFn)}

								<Table.Root class="mt-4 text-sm">
									<Table.Body>
										{#each filtered as absentee}
											<Table.Row>
												<Table.Cell class="w-[80px] text-center">
													{absentee.rollNumber}
												</Table.Cell>
												<Table.Cell class="w-full">{absentee.fullName}</Table.Cell>
												<Table.Cell class="w-full text-right">
													{#if showEveryone[i] && absentees.includes(absentee.id)}
														<XIcon class="size-3" />
													{/if}
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex w-full flex-col items-center space-y-3 p-6 text-sm text-muted-foreground">
					<CalendarCheckIcon />
					<div>No periods were recorded on this day.</div>
				</div>
			{/if}
		{:else}
			<div class="flex w-full flex-col items-center space-y-3 p-6 text-sm text-muted-foreground">
				<EyeIcon />
				<div>No students found!</div>
			</div>
		{/if}
	{:else if periods.state === "failed"}
		<LoadingFailedCard>
			<div>{periods.message}</div>
		</LoadingFailedCard>
	{:else}
		<LoadingFailedCard>
			<div>Unknown option.</div>
		</LoadingFailedCard>
	{/if}
</div>
