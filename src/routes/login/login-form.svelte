<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import * as Form from "$lib/components/ui/form";
	import { formSchema, type FormSchema } from "./form-schema";
	import { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";

	export let data: SuperValidated<Infer<FormSchema>>;

	const form = superForm(data, {
		validators: zodClient(formSchema),
	});
	const { form: formData, enhance } = form;
</script>

<Card.Root class="mx-auto max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your ID below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" use:enhance action="?/login" class="grid gap-4">
			<Form.Field {form} name="userId">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Your ID</Form.Label>
						<Input {...props} bind:value={$formData.userId} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex items-center">
							<Form.Label for="password">Password</Form.Label>
							<a href="##" class="ml-auto inline-block text-sm underline">Forgot your password?</a>
						</div>
						<Input {...props} bind:value={$formData.password} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button>Login</Form.Button>
		</form>

		<div class="mt-4 text-center text-sm">
			Contact your administrator if you don't have an account or you're having trouble logging in.
		</div>
	</Card.Content>
</Card.Root>
