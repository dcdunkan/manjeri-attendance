<script lang="ts">
	import type { getStudent } from "$lib/server/db/students";
	import type { LoadedData, AwaitReturn, Payload, Result } from "$lib/types";
	import { ArrowLeftIcon, KeyRoundIcon, LoaderCircleIcon, XCircleIcon } from "lucide-svelte";
	import * as Table from "$lib/components/ui/table";
	import { onMount } from "svelte";
	import type { PageData } from "./$types";
	import { pluralize } from "$lib/helpers";
	import { Label } from "$lib/components/ui/label";
	import PasswordInput from "./password-input.svelte";
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import { slide } from "svelte/transition";
	import PasswordStrengthMeter from "./password-strength-meter.svelte";
	import { z } from "zod";
	import { toast } from "svelte-sonner";

	let { data }: { data: PageData } = $props();

	type Details = NonNullable<AwaitReturn<typeof getStudent>>;

	let details = $state<LoadedData<Details>>({
		state: "pending",
		message: "Loading details...",
	});
	let isDefaultPassword = $state<LoadedData<boolean>>({ state: "pending", message: "" });

	onMount(async () => {
		try {
			const result = await data.student;
			if (result == null)
				details = { state: "failed", message: "Could not get the student details" };
			else details = { state: "resolved", data: result };

			try {
				const result = await data.isDefaultPassword;
				if (result == null)
					isDefaultPassword = { state: "failed", message: "Could not get password details" };
				else isDefaultPassword = { state: "resolved", data: result };
			} catch (error) {
				details = { state: "failed", message: "Could not get the student details" };
			}
		} catch (error) {
			details = { state: "failed", message: "Could not get the student details" };
		}
	});

	let passwordSection: HTMLDivElement;
	const PASSWORD_KEYS = ["current", "password", "confirm"] as const;
	type PasswordKey = (typeof PASSWORD_KEYS)[number];
	let passwordInputs = $state<Record<PasswordKey, string>>({
		current: "",
		password: "",
		confirm: "",
	});
	const passwdStrSchema = z.string().trim().min(6, "Too weak").max(128, "Too strong");
	const passwordSchema = z
		.object<Record<PasswordKey, z.ZodString>>({
			current: passwdStrSchema,
			password: passwdStrSchema,
			confirm: passwdStrSchema,
		})
		.refine((arg) => arg.password === arg.confirm, {
			message: "Passwords don't match!",
			path: ["password", "confirm"],
		})
		.refine((arg) => arg.current !== arg.password, {
			message: "New password must be different!",
			path: ["current", "password", "confirm"],
		});
	const validated = $derived.by(() => {
		const result = passwordSchema.safeParse(passwordInputs);
		if (result.success) return { current: undefined, password: undefined, confirm: undefined };
		return result.error.issues.reduceRight<Record<PasswordKey, string | undefined>>(
			(issues, issue) => {
				const keys = new Set(issue.path.filter((path) => typeof path === "string"));
				if (keys.has("current")) issues.current = issue.message;
				if (keys.has("password")) issues.password = issue.message;
				if (keys.has("confirm")) issues.confirm = issue.message;
				return issues;
			},
			{ current: undefined, password: undefined, confirm: undefined },
		);
	});
	let showPasswordInputErrors = $state(false);
	let isChangingPassword = $state(false);
</script>

<div class="sticky top-0 z-10 bg-background px-6 py-4">
	<div class="flex place-items-center gap-3">
		<a href="/" class="aspect-square p-1">
			<ArrowLeftIcon class="size-4" />
		</a>
		<h1 class="text-lg">Account Settings</h1>
	</div>
</div>

<div class="flex-grow space-y-6 p-8 pt-2">
	{#if isDefaultPassword.state === "resolved" && isDefaultPassword.data === true}
		<div
			transition:slide
			class="rounded border border-error-border bg-error p-4 text-sm text-error-foreground"
		>
			<div class="flex place-items-center gap-4">
				<KeyRoundIcon />
				<div class="space-y-0.5">
					<div class="font-medium">Change your password</div>
					<div>Password change is highly recommended!</div>
				</div>
				<button
					onclick={() => {
						if (passwordSection == null) return;
						passwordSection.scrollIntoView({ behavior: "smooth", block: "center" });
					}}
					class={buttonVariants({ variant: "link", class: "ml-auto text-error-foreground" })}
					>Change now</button
				>
			</div>
		</div>
	{/if}

	<div class="space-y-2">
		<div class="text-xl">Account Details</div>

		{#if details.state === "pending"}
			<div class="flex w-full flex-col items-center justify-center space-y-2 p-6">
				<LoaderCircleIcon class="animate-spin" />
				<div>{details.message}</div>
			</div>
		{:else if details.state === "resolved"}
			<Table.Root>
				<Table.Body>
					<Table.Row>
						<Table.Head>Roll number</Table.Head>
						<Table.Cell>{details.data.rollNumber}</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Head>Full name</Table.Head>
						<Table.Cell>{details.data.fullName}</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Head>ID</Table.Head>
						<Table.Cell>{details.data.id}</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Head>Login</Table.Head>
						<Table.Cell>{details.data.account.login}</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Head>Batch</Table.Head>
						<Table.Cell>{details.data.batch.name}</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Head>Enrolled in</Table.Head>
						<Table.Cell>
							{details.data.enrollments.length}
							{pluralize(details.data.representations.length, "subject", "subjects")}
						</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Head>Represents</Table.Head>
						<Table.Cell>
							{details.data.representations.length}
							{pluralize(details.data.representations.length, "subject", "subjects")}
						</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table.Root>
		{:else if details.state === "failed"}
			<div class="flex w-full flex-col items-center justify-center space-y-2 p-6">
				<XCircleIcon />
				<div>{details.message}</div>
			</div>
		{:else}
			<div class="flex w-full flex-col items-center justify-center space-y-2 p-6">
				<div>Unknown action.</div>
			</div>
		{/if}
	</div>

	<!-- <div>
	<div class="text-lg">Set display name</div>
</div> -->

	<div bind:this={passwordSection} class="space-y-4">
		<div class="text-xl">Change Password</div>

		<p>
			Enter your current password to change your password. You will be logged out automatically once
			you have changed your password.
		</p>

		<div class="w-full space-y-3 transition-all duration-150 sm:w-2/3">
			<div class="space-y-2">
				<Label for="current-password">Your current password</Label>
				<PasswordInput
					disabled={isChangingPassword}
					bind:value={passwordInputs.current}
					id="current-password"
					placeholder="Current password"
					onkeydown={() => (showPasswordInputErrors = true)}
				/>

				{#if showPasswordInputErrors && passwordInputs.current.length > 0 && validated.current != null}
					<div transition:slide class="text-sm text-error-foreground">{validated.current}</div>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="new-password">New password to use</Label>
				<PasswordInput
					disabled={isChangingPassword}
					bind:value={passwordInputs.password}
					id="new-password"
					placeholder="New password"
					onkeydown={() => (showPasswordInputErrors = true)}
				/>
				{#if passwordInputs.password.length > 0}
					<div transition:slide>
						<PasswordStrengthMeter password={passwordInputs.password} />
					</div>

					{#if showPasswordInputErrors && validated.password != null}
						<div transition:slide class="text-sm text-error-foreground">{validated.password}</div>
					{/if}
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="confirm-password">Confirm your new password</Label>
				<PasswordInput
					disabled={isChangingPassword}
					bind:value={passwordInputs.confirm}
					id="confirm-password"
					placeholder="Confirm password"
					onkeydown={() => (showPasswordInputErrors = true)}
				/>

				{#if passwordInputs.confirm.length > 0}
					<div transition:slide>
						<PasswordStrengthMeter password={passwordInputs.confirm} />
					</div>

					{#if showPasswordInputErrors && validated.confirm != null}
						<div transition:slide class="text-sm text-error-foreground">{validated.confirm}</div>
					{/if}
				{/if}
			</div>
		</div>

		<div>
			<Button
				variant="outline"
				disabled={isChangingPassword}
				onclick={() => {
					passwordInputs = { current: "", password: "", confirm: "" };
				}}>Reset</Button
			>
			<Button
				disabled={isChangingPassword || !passwordSchema.safeParse(passwordInputs).success}
				onclick={async () => {
					if (isChangingPassword) return;
					const parsed = passwordSchema.safeParse(passwordInputs);
					if (!parsed.success) {
						return toast.error(parsed.error.issues[0]?.message ?? "Invalid inputs!");
					}

					isChangingPassword = true;

					const response = await fetch("/api/student/account/password", {
						method: "PATCH",
						body: JSON.stringify({
							currentPassword: passwordInputs.current,
							newPassword: passwordInputs.password,
						} satisfies Payload.ChangePassword),
						headers: { "Content-Type": "application/json" },
					});
					if (!response.ok && response.status !== 400) {
						isChangingPassword = false;
						toast.error("Failed to change your password.");
						return;
					}
					const result: Result = await response.json();
					if (!result.ok) {
						isChangingPassword = false;
						toast.error(result.reason);
						return;
					}

					passwordInputs = { current: "", password: "", confirm: "" };
					toast.success("Password was changed successfully!");
					showPasswordInputErrors = false;
					window.location.assign("/logout");
					isChangingPassword = false;
				}}
			>
				{#if isChangingPassword}
					<LoaderCircleIcon class="animate-spin" />
				{:else}
					Change password
				{/if}
			</Button>
		</div>
	</div>
</div>
