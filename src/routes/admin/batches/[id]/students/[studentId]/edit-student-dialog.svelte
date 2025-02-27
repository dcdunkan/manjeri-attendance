<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { generateLoginId } from "$lib/helpers";
	import type { getStudent } from "$lib/server/db/students";
	import type { Result, Payload } from "$lib/types";
	import { LoaderCircleIcon } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { slide } from "svelte/transition";
	import { z } from "zod";

	let {
		open = $bindable(false),
		student = $bindable(),
	}: {
		open: boolean;
		student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
	} = $props();

	let studentDetails = $state({
		fullName: student.fullName,
		rollNumber: student.rollNumber,
	});
	let isUpdating = $state(false);

	const detailsSchema = z
		.object({
			fullName: z
				.string({
					invalid_type_error: "Invalid name input",
					required_error: "A name is required",
				})
				.trim()
				.nonempty("A name is required")
				.min(3, "Name is too short")
				.max(32, "Name is too long"),
			rollNumber: z
				.number({
					invalid_type_error: "Invalid roll number",
					required_error: "Roll number is required",
				})
				.min(1, "Must be a natural number.")
				.finite(),
		})
		.refine(
			(details) =>
				!(details.fullName === student.fullName && details.rollNumber === student.rollNumber),
			{
				message: "No changes were made",
				path: ["button"],
			},
		);

	type Details = z.infer<typeof detailsSchema>;

	const validated = $derived.by(() => {
		const result = detailsSchema.safeParse(studentDetails);
		if (result.success) return { success: true, hasMadeChanges: true };
		return {
			success: false,
			hasMadeChanges: !result.error.issues.some(
				(issue) => issue.code === "custom" && issue.path[0] === "button",
			),
			errors: result.error.issues.reduceRight<Record<keyof Details, string | undefined>>(
				(issues, issue) => {
					const keys = new Set(issue.path.filter((path) => typeof path === "string"));
					if (keys.has("fullName")) issues.fullName = issue.message;
					if (keys.has("rollNumber")) issues.rollNumber = issue.message;
					return issues;
				},
				{ fullName: undefined, rollNumber: undefined },
			),
		};
	});

	let loginId = $derived.by(() => {
		if (validated.errors?.rollNumber != null) return null;
		return generateLoginId(studentDetails.rollNumber, student.batch.name);
	});

	async function updateStudentDetails() {
		const parsed = detailsSchema.safeParse(studentDetails);
		if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid inputs!");

		isUpdating = true;
		const response = await fetch("/api/admin/batch/student", {
			method: "PATCH",
			body: JSON.stringify({
				batchId: student.batch.id,
				studentId: student.id,
				fullName: parsed.data.fullName,
				rollNumber: parsed.data.rollNumber,
			} satisfies Payload.UpdateStudentDetails),
			headers: { "Content-Type": "application/json" },
		});
		if (!response.ok && response.status !== 400) {
			isUpdating = false;
			toast.error("Failed to update details.");
			return;
		}
		const result: Result<{ login: string }> = await response.json();
		if (!result.ok) {
			isUpdating = false;
			toast.error(result.reason);
			return;
		}

		isUpdating = false;
		open = false;
		student.fullName = parsed.data.fullName;
		student.rollNumber = parsed.data.rollNumber;
		student.account.login = result.data.login;
		toast.success("Details were updated");
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit student details</Dialog.Title>
			<Dialog.Description>{student.fullName} ({student.rollNumber})</Dialog.Description>
		</Dialog.Header>

		<div class="flex place-items-start gap-2">
			<div class="space-y-2">
				<Label for="name">Student name</Label>
				<Input
					id="name"
					type="text"
					required
					bind:value={studentDetails.fullName}
					onkeypress={async (e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							await updateStudentDetails();
						}
					}}
				/>
				{#if validated.hasMadeChanges && validated.errors?.fullName}
					<div transition:slide class="text-xs text-error-foreground">
						{validated.errors.fullName}
					</div>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="roll-number">Roll number</Label>
				<Input
					id="roll-number"
					type="number"
					required
					min="1"
					bind:value={studentDetails.rollNumber}
					onkeypress={async (e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							await updateStudentDetails();
						}
					}}
				/>
				{#if validated.hasMadeChanges && validated.errors?.rollNumber}
					<div transition:slide class="text-xs text-error-foreground">
						{validated.errors.rollNumber}
					</div>
				{/if}
			</div>
		</div>

		<div class="space-y-2">
			<Label for="loginId">Login ID</Label>
			<Input
				type="text"
				disabled
				id="loginId"
				value={loginId}
				placeholder={loginId == null ? "Couldn't generate." : loginId}
			/>

			<div class="text-sm text-warning-foreground">
				WARNING: Changing the roll number will also change the login ID of the person, but NOT the
				password.
			</div>
		</div>

		<Dialog.Footer class="gap-y-2">
			<Button variant="secondary" onclick={() => (open = false)}>Close</Button>
			<Button
				disabled={isUpdating || !validated.success}
				class="transition-all duration-150"
				onclick={updateStudentDetails}
			>
				{#if isUpdating}
					<LoaderCircleIcon class="animate-spin" /> Updating...
				{:else if !validated.hasMadeChanges}
					Make some changes
				{:else}
					Update details
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
