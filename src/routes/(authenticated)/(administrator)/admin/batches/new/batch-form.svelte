<script lang="ts" module>
	import { z } from "zod";

	export const formSchema = z.object({
		name: z.string().min(2).max(64),
		subjects: z.array(z.string()).refine((value) => value.some((item) => item), {
			message: "Batch must have at least one subject.",
		}),
	});

	export type FormSchema = typeof formSchema;
</script>

<script lang="ts">
	import SuperDebug, { superForm, type Infer, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";
	import { Input } from "$lib/components/ui/input";
	import * as Form from "$lib/components/ui/form";
	import { Button } from "$lib/components/ui/button";
	import { PlusIcon, XIcon } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { browser } from "$app/environment";

	let { data }: { data: SuperValidated<Infer<FormSchema>> } = $props();

	const form = superForm(data, {
		validators: zodClient(formSchema),
		delayMs: 1000,
		clearOnSubmit: "errors-and-message",
		onError: (event) => {
			if (event.result.error.message) {
				toast.error("Something went wrong!");
			}
		},
	});
	const { form: formData, enhance } = form;

	let subjectInput = $state<string>("");
	let subjectInputElement = $state<HTMLInputElement | null>(null);

	function addSubject(subject: string) {
		if ($formData.subjects.includes(subject)) {
			return toast.error("Subject is already added!");
		}
		$formData.subjects = [...$formData.subjects, subject].toSorted();
	}

	function removeSubject(subject: string) {
		if (!$formData.subjects.includes(subject)) return;
		$formData.subjects = $formData.subjects.filter((s) => s !== subject);
	}
</script>

<form method="POST" use:enhance class="grid gap-4" autocomplete="off">
	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class="text-base">Batch name</Form.Label>
				<Input
					{...props}
					type="text"
					bind:value={$formData.name}
					placeholder="A unique, short and simple name for the batch"
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<!-- TODO: restrict spaces and special characters in batch name. -->
	<Form.Fieldset {form} name="subjects" class="space-y-0">
		<div class="mb-4">
			<Form.Legend class="text-base">Subjects</Form.Legend>
			<Form.Description>Add the subjects you want to assign to the batch.</Form.Description>
		</div>
		<div class="space-y-2">
			<Form.FieldErrors />
			{#each $formData.subjects as subject, i}
				{@const checked = $formData.subjects.includes(subject)}
				<div class="flex flex-row items-start">
					<Form.Control>
						{#snippet children({ props })}
							<input type="checkbox" {...props} {checked} value={subject} class="hidden" />
							<div class="flex w-full place-items-center justify-between gap-2 rounded border p-1">
								<div class="ml-4">{subject}</div>
								<Button variant="ghost" onclick={() => removeSubject(subject)}><XIcon /></Button>
							</div>
						{/snippet}
					</Form.Control>
				</div>
			{/each}

			<div class="flex gap-2">
				<Input
					bind:ref={subjectInputElement}
					type="text"
					placeholder="Subject name to be added"
					bind:value={subjectInput}
				/>
				<Button
					onclick={() => {
						const input = subjectInput.trim();
						if (input.length == 0) {
							subjectInput = "";
							return toast.error("Invalid subject name");
						}
						addSubject(input);
						subjectInputElement?.focus();
						subjectInput = ""; // clear the input
					}}
					variant="secondary"><PlusIcon /> Add subject</Button
				>
			</div>
		</div>
	</Form.Fieldset>
	<Form.Button>Register</Form.Button>
	{#if browser}
		<SuperDebug data={$formData} />
	{/if}
</form>
