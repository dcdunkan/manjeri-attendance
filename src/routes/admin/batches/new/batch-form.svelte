<script lang="ts" module>
	import { z } from "zod";

	export const formSchema = z.object({
		name: z.string().trim().min(2).max(64),
		subjects: z
			.array(z.string().trim().min(2).max(64))
			.min(1, "Batch must have at least one subject."),
	});

	export type FormSchema = typeof formSchema;
</script>

<script lang="ts">
	import { superForm, type Infer, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";
	import { Input } from "$lib/components/ui/input";
	import * as Form from "$lib/components/ui/form";
	import { Button } from "$lib/components/ui/button";
	import { PlusIcon, XIcon } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import EmptyInfobox from "$lib/components/empty-infobox.svelte";

	let { data }: { data: SuperValidated<Infer<FormSchema>> } = $props();

	const form = superForm(data, {
		validators: zodClient(formSchema),
		delayMs: 1000,
		clearOnSubmit: "errors-and-message",
		onError: (event) => {
			toast.error(event.result.error.message);
		},
	});
	const { form: formData, enhance } = form;

	let subjectInput = $state<string>("");
	let subjectInputElement = $state<HTMLInputElement | null>(null);

	function addSubject(subject: string) {
		if ($formData.subjects.includes(subject)) {
			toast.error("Subject is already added!");
			return false;
		}
		$formData.subjects = [...$formData.subjects, subject].toSorted();
		return true;
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
			<Form.Description>
				Add the subjects you want to assign to the batch. Subject names must be distinct. At least
				one subject is required to register the batch.
			</Form.Description>
		</div>
		<div class="space-y-2">
			<Form.FieldErrors />
			{#each $formData.subjects as subject, i (i)}
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
			{:else}
				<EmptyInfobox>
					<p>No subjects have been added yet.</p>
					<p>Type in the subject name and click "Add subject".</p>
				</EmptyInfobox>
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
						const added = addSubject(input);
						subjectInputElement?.focus();
						if (added) subjectInput = ""; // clear the input
					}}
					variant="secondary"><PlusIcon /> Add subject</Button
				>
			</div>
		</div>
	</Form.Fieldset>
	<Form.Button>Register batch</Form.Button>
</form>
