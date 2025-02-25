<script lang="ts">
	import SearchInput from "$lib/components/search-input.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Table from "$lib/components/ui/table";
	import type { getEnrolledStudents } from "$lib/server/db/enrollments";
	import type { getSubject } from "$lib/server/db/subjects";
	import type { LoadedData, Data, Result, AwaitReturn, Payload } from "$lib/types";
	import clsx from "clsx";
	import {
		CheckIcon,
		FileQuestionIcon,
		LoaderCircleIcon,
		MinusIcon,
		PlusIcon,
		XCircleIcon,
	} from "lucide-svelte";
	import { toast } from "svelte-sonner";

	let {
		open = $bindable(),
		subject = $bindable(),
		enrollments = $bindable(),
	}: {
		open: boolean;
		subject: AwaitReturn<typeof getSubject>;
		enrollments: AwaitReturn<typeof getEnrolledStudents>;
	} = $props();

	let filterString = $state("");
	let transformedFilterStr = $derived(filterString.toLowerCase());

	type EnrolledStudent = Data.EnrollStudents.GET["batchStudents"][number] & {
		enrolled: boolean;
		pending: boolean;
		represents: boolean;
	};

	let students = $state<LoadedData<EnrolledStudent[]>>({
		state: "pending",
		message: "Loading latest student data...",
	});

	function comparatorFn(a: EnrolledStudent, b: EnrolledStudent) {
		return a.rollNumber - b.rollNumber;
	}

	function filterFn(enrolled: boolean) {
		return (student: EnrolledStudent) => {
			return (
				student.fullName.toLowerCase().includes(transformedFilterStr) &&
				student.enrolled === enrolled
			);
		};
	}

	let isSaving = $state(false);

	$effect(() => {
		if (!open) return;
		filterString = "";

		const sync = { batchId: subject.batch.id, subjectId: subject.id };

		(async () => {
			students = { state: "pending", message: "Loading latest student data..." };
			const searchParams = new URLSearchParams({
				batchId: sync.batchId.toString(),
				subjectId: sync.subjectId.toString(),
			});
			const response = await fetch(`/api/admin/subjects/enroll-students?${searchParams}`);
			if (!response.ok && response.status !== 400) {
				students = { state: "failed", message: "Failed to load student list" };
				return;
			}
			const result: Result<Data.EnrollStudents.GET> = await response.json();
			if (!result.ok) {
				students = { state: "failed", message: "Failed to load student list" };
				return;
			}

			const reps = new Set(result.data.representatives.map((r) => r.student.id));
			const enrolledStudents = new Set(result.data.enrollments.map((e) => e.student.id));
			const transformed = result.data.batchStudents.map<EnrolledStudent>((student) => {
				return {
					...student,
					enrolled: enrolledStudents.has(student.id),
					pending: false,
					represents: reps.has(student.id),
				};
			});

			enrollments = result.data.enrollments;
			subject.representatives = result.data.representatives
				.map((rep) => {
					const student = result.data.batchStudents.findIndex((x) => x.id === rep.student.id);
					if (student == null) return;
					return {
						id: rep.id,
						subjectId: sync.subjectId,
						student: { fullName: result.data.batchStudents[student].fullName },
						studentId: rep.student.id,
					};
				})
				.filter((rep) => rep != null);

			students = { state: "resolved", data: transformed };
		})();
	});

	async function saveEnrollments() {
		if (students.state !== "resolved" || isSaving) return;
		const pending = students.data.filter((student) => student.pending);
		if (pending.length == 0) return;

		const grouped = pending.reduce(
			(grouped, student) => {
				if (student.enrolled) grouped.enroll.push(student.id);
				else grouped.delist.push(student.id);
				return grouped;
			},
			{ enroll: new Array<number>(), delist: new Array<number>() },
		);

		if (grouped.enroll.length === 0 && grouped.delist.length === 0) return;

		isSaving = true;
		const response = await fetch("/api/admin/subjects/enroll-students", {
			method: "POST",
			body: JSON.stringify({
				batchId: subject.batch.id,
				subjectId: subject.id,
				enroll: grouped.enroll,
				delist: grouped.delist,
			} satisfies Payload.EnrollStudents.POST),
			headers: { "Content-Type": "application/json" },
		});
		if (!response.ok && response.status !== 400) {
			isSaving = false;
			toast.error("Couldn't update enrollments!");
			return;
		}
		const result: Result<Data.EnrollStudents.POST> = await response.json();
		if (!result.ok) {
			isSaving = false;
			toast.error("Couldn't update enrollments!");
			return;
		}

		const studentsData = students.data;
		const newEnrollments = result.data.enrollments.map((enrolled) => {
			const student = studentsData.find((s) => s.id === enrolled.studentId);
			if (student == null) return;
			return {
				id: enrolled.id,
				student: {
					id: student.id,
					batchId: subject.batch.id,
					absentCount: subject.periodCount,
					fullName: student.fullName,
					isRep: false,
					rollNumber: student.rollNumber,
				},
			};
		});

		enrollments = enrollments
			.filter(
				(enrolled) =>
					result.data.delists.findIndex(
						(delisted) => delisted.studentId === enrolled.student.id,
					) === -1,
			)
			.concat(newEnrollments.filter((enroll) => enroll != null));

		const demotedRepIds = new Set(result.data.demoted.map((x) => x.id));
		subject.representatives = subject.representatives.filter((rep) => !demotedRepIds.has(rep.id));

		open = false;
		isSaving = false;

		const values = [
			["Enrolled", result.data.enrollments.length],
			["Delisted", result.data.delists.length],
			["Demoted", result.data.demoted.length],
		] as [string, number][];
		toast.success(
			values
				.filter(([, value]) => value > 0)
				.map(([label, value], i) => `${i === 0 ? label : label.toLowerCase()}: ${value}`)
				.join(", "),
		);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex h-[80vh] flex-col"
		onOpenAutoFocus={(event) => event.preventDefault()}
	>
		<Dialog.Header>
			<Dialog.Title>Manage Students</Dialog.Title>
			<Dialog.Description>Enroll or delist students</Dialog.Description>
		</Dialog.Header>

		<SearchInput bind:value={filterString} placeholder="Filter students..." />

		<div class="flex-grow overflow-y-scroll rounded border">
			{#if students.state === "pending"}
				<div class="flex size-full flex-col items-center justify-center gap-2">
					<LoaderCircleIcon class="size-5 animate-spin" />
					<div class="text-sm">{students.message}</div>
				</div>
			{:else if students.state === "resolved"}
				{@const enrolled = students.data.filter(filterFn(true))}
				{@const delisted = students.data.filter(filterFn(false))}

				{#snippet table(title: string, changes: EnrolledStudent[])}
					<div class="mb-3">
						<div
							class="sticky top-0 z-10 border-b bg-background p-2 text-sm uppercase text-muted-foreground"
						>
							{title} ({changes.length})
						</div>
						<Table.Root>
							<Table.Body>
								{#each changes.toSorted(comparatorFn) as student}
									<Table.Row
										class={clsx("cursor-pointer hover:bg-inherit", {
											"text-green-600": student.enrolled && student.pending,
											"text-red-600": !student.enrolled && student.pending,
										})}
										onclick={() => {
											if (students.state !== "resolved") return;
											const thisStudent = students.data.find((s) => s.id === student.id);
											if (thisStudent == null) return;
											thisStudent.enrolled = !thisStudent.enrolled;
											thisStudent.pending = !thisStudent.pending;
										}}
									>
										<Table.Cell class="w-[60px] text-right">{student.rollNumber}</Table.Cell>
										<Table.Cell>
											{student.fullName}
											{#if student.represents}
												<CheckIcon class="ml-2 inline-block size-4 text-yellow-500" />
											{/if}
										</Table.Cell>
										<Table.Cell class="flex justify-end">
											{#if student.pending}
												<LoaderCircleIcon class="size-4 animate-spin" />
											{:else}
												<MinusIcon class="size-4" />
											{/if}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/snippet}

				{@render table("Enrolled", enrolled)}
				{@render table("Delisted", delisted)}
			{:else if students.state === "failed"}
				<div class="flex size-full flex-col items-center justify-center gap-2">
					<XCircleIcon class="size-5" />
					<div class="text-sm">{students.message}</div>
				</div>
			{:else}
				<div class="flex size-full flex-col items-center justify-center gap-2">
					<FileQuestionIcon class="size-5" />
					<div class="text-sm">Unknown action.</div>
				</div>
			{/if}
		</div>

		<div class="text-sm">
			<CheckIcon class="mx-1 inline-block size-4 text-yellow-500" /> Representative &middot;
			<span class="text-green-600">To be enrolled</span>
			&middot; <span class="text-red-600">To be delisted</span>
		</div>

		<Dialog.Footer class="gap-y-2">
			<Button variant="outline" onclick={() => (open = false)}>Close</Button>
			<Button
				disabled={students.state !== "resolved" ||
					!students.data.some((s) => s.pending) ||
					isSaving}
				onclick={saveEnrollments}
			>
				{#if isSaving}
					<LoaderCircleIcon class="animate-spin" />
				{:else}
					Save changes
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
