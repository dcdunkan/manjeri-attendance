<script lang="ts" module>
	import { z } from "zod";

	export const formSchema = z.object({
		userId: z.string().trim().min(2).max(50),
		password: z.string().min(6).max(128),
	});

	export type FormSchema = typeof formSchema;
</script>

<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import * as Form from "$lib/components/ui/form";
	import { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";
	import { toast } from "svelte-sonner";
	import { LoaderCircleIcon } from "lucide-svelte";

	let { data }: { data: SuperValidated<Infer<FormSchema>> } = $props();

	const form = superForm(data, {
		validators: zodClient(formSchema),
		onError(event) {
			toast.error(event.result.error.message);
		},
	});
	const { form: formData, enhance, submitting } = form;
</script>

<div class="mx-auto max-w-sm p-6">
	<form method="POST" use:enhance action="?/login" class="grid gap-4">
		<Form.Field {form} name="userId">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Your ID</Form.Label>
					<Input {...props} bind:value={$formData.userId} autocomplete="email" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="password">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="password">Password</Form.Label>
					<Input
						{...props}
						type="password"
						id="password"
						autocomplete="new-password"
						bind:value={$formData.password}
						class="font-bold tracking-widest"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Button disabled={$submitting}>
			{#if $submitting}
				<LoaderCircleIcon class="animate-spin" /> Logging in...
			{:else}
				Login
			{/if}
		</Form.Button>
	</form>
</div>
