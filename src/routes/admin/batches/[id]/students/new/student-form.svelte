<script lang="ts" module>
	import { z } from "zod";

	// TODO: schemas need a lot more refinings
	export const formSchema = z.object({
		name: z.string().min(3).max(256),
		rollNumber: z.number().min(1, "Roll number cannot be a negative number.").default(1),
		loginId: z.string().min(4, "Too short."),
		password: z.string().min(6, "Weak password.").max(128, "Can't be that heavy."),
		enrolledSubjects: z.array(z.number()),
	});

	export type FormSchema = typeof formSchema;
</script>

<script lang="ts">
	import { superForm, type Infer, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";
	import { Input } from "$lib/components/ui/input";
	import * as Form from "$lib/components/ui/form";
	import { toast } from "svelte-sonner";
	import type { getBatchWithSubjects } from "$lib/server/db/batches";
	import { Label } from "$lib/components/ui/label";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { LoaderCircleIcon, LockIcon, UnlockIcon, UserPlusIcon } from "lucide-svelte";
	import { generateLoginId } from "$lib/helpers";
	import Button from "$lib/components/ui/button/button.svelte";

	let {
		form: baseForm,
		batch,
	}: {
		form: SuperValidated<Infer<FormSchema>>;
		batch: NonNullable<Awaited<ReturnType<typeof getBatchWithSubjects>>>;
	} = $props();

	const form = superForm(baseForm, {
		dataType: "json",
		validators: zodClient(formSchema),
		delayMs: 1000,
		clearOnSubmit: "errors-and-message",
		onError: (event) => {
			toast.error(event.result.error.message);
		},
	});
	const { form: formData, enhance, submitting } = form;

	const generatedLoginId = generateLoginId($formData.rollNumber, batch.name);
	let hasGenerated = $state<boolean>(generatedLoginId != null);
	if (generatedLoginId != null) {
		formData.update(
			($form) => {
				$form.loginId = generatedLoginId;
				$form.password = generatedLoginId;
				return $form;
			},
			{ taint: true },
		);
	}

	formData.update(
		($form) => {
			$form.enrolledSubjects = [...batch.subjects.map(({ id }) => id)];
			return $form;
		},
		{ taint: true },
	);

	let manualPassword = $state(false);

	function selectSubject(subjectId: number) {
		if (!$formData.enrolledSubjects.includes(subjectId)) {
			$formData.enrolledSubjects = [...$formData.enrolledSubjects, subjectId];
		}
	}

	function deselectSubject(subjectId: number) {
		if ($formData.enrolledSubjects.includes(subjectId)) {
			$formData.enrolledSubjects = $formData.enrolledSubjects.filter(
				(subject) => subject !== subjectId,
			);
		}
	}

	function onRollNumberChange() {
		const generated = generateLoginId($formData.rollNumber, batch.name);
		hasGenerated = generated != null;

		if (generated != null) {
			formData.update(
				($form) => {
					$form.loginId = generated;
					if (!manualPassword) {
						$form.password = generated;
					}
					return $form;
				},
				{ taint: true },
			);
		}
	}
</script>

<form method="POST" use:enhance class="grid gap-2" autocomplete="off">
	<div class="grid grid-cols-2 gap-2">
		<div class="space-y-2">
			<Label class="text-base">Batch</Label>
			<Input disabled type="text" value={batch.name} placeholder="Batch of the student" />
		</div>
		<div>
			<Form.Field {form} name="rollNumber">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="text-base">Roll number</Form.Label>
						<Input
							{...props}
							type="number"
							bind:value={$formData.rollNumber}
							placeholder="Serial roll number"
							min={1}
							oninput={onRollNumberChange}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</div>

	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class="text-base">Password</Form.Label>
				<div class="flex place-items-center gap-2">
					<Input
						{...props}
						type="text"
						bind:value={$formData.password}
						class="font-mono"
						placeholder="Account password"
						onkeydown={() => (manualPassword = true)}
					/>
					<Button
						class="aspect-square"
						variant={manualPassword ? "secondary" : "outline"}
						onclick={() => {
							manualPassword = !manualPassword;
							if (manualPassword) return;
							else onRollNumberChange();
						}}
					>
						{#if manualPassword}
							<UnlockIcon />
						{:else}
							<LockIcon />
						{/if}
					</Button>
				</div>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />

		<div class="text-sm text-muted-foreground">
			{#if hasGenerated}
				The user can login with the login ID <code>{$formData.loginId}</code>.
			{:else}
				Invalid roll number. Can't generate proper login ID.
			{/if}
		</div>
	</Form.Field>

	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class="text-base">Student name</Form.Label>
				<Input
					{...props}
					type="text"
					bind:value={$formData.name}
					placeholder="Full name of the student"
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Fieldset {form} name="enrolledSubjects" class="space-y-0">
		<div class="mb-4">
			<Form.Legend class="text-base">Enrolled Subjects</Form.Legend>
			<Form.Description>Select the subjects the student is enrolled to.</Form.Description>
		</div>
		<div class="space-y-4">
			{#each batch.subjects as subject}
				{@const checked = $formData.enrolledSubjects.includes(subject.id)}
				<div class="flex flex-row items-center space-x-3">
					<Form.Control>
						{#snippet children({ props })}
							<Checkbox
								{...props}
								{checked}
								value={subject.id.toString()}
								onCheckedChange={(checked) => {
									if (checked) selectSubject(subject.id);
									else deselectSubject(subject.id);
								}}
							/>
							<Form.Label class="text-base font-normal">
								{subject.name}
							</Form.Label>
						{/snippet}
					</Form.Control>
				</div>
			{/each}
			<Form.FieldErrors />
		</div>
	</Form.Fieldset>

	<Form.Button disabled={$submitting}>
		{#if $submitting}
			<LoaderCircleIcon /> Registering...
		{:else}
			<UserPlusIcon />Register student
		{/if}
	</Form.Button>
</form>
