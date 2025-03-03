<script lang="ts">
	import type { LoadedData, Payload, Result } from "$lib/types";
	import {
		AlertCircleIcon,
		ArrowLeftIcon,
		CircleHelpIcon,
		KeyRoundIcon,
		LaptopIcon,
		LoaderCircleIcon,
		SmartphoneIcon,
		XCircleIcon,
	} from "lucide-svelte";
	import * as Table from "$lib/components/ui/table";
	import { onMount } from "svelte";
	import type { PageProps } from "./$types";
	import { negateFn, pluralize, timeDistance } from "$lib/helpers";
	import { Label } from "$lib/components/ui/label";
	import PasswordInput from "./password-input.svelte";
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import { slide } from "svelte/transition";
	import PasswordStrengthMeter from "./password-strength-meter.svelte";
	import { z } from "zod";
	import { toast } from "svelte-sonner";
	import LoadingCard from "$lib/components/loading-card.svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";
	import clsx from "clsx";
	import EmptyInfobox from "$lib/components/empty-infobox.svelte";
	import { SESSION_MODIFY_RESTRICTION_PERIOD } from "$lib/constants";
	import LogoutDialog from "./logout-dialog.svelte";
	import type { AccountSession } from "./types";

	let { data }: PageProps = $props();

	type Details = NonNullable<Awaited<typeof data.student>>;
	let details = $state<LoadedData<Details>>({
		state: "pending",
		message: "Loading details...",
	});
	let isDefaultPassword = $state<LoadedData<boolean>>({ state: "pending", message: "" });
	let sessions = $state<
		LoadedData<{
			currentSession: AccountSession;
			otherSessions: AccountSession[];
		}>
	>({
		state: "pending",
		message: "Fetching sessions...",
	});
	const now = Date.now();

	onMount(async () => {
		try {
			const result = await data.student;
			if (result == null)
				details = { state: "failed", message: "Could not get the student details" };
			else details = { state: "resolved", data: result };

			try {
				const result = await data.sessions;
				const currentSession = result.find(isCurrentSession);
				if (currentSession == null) {
					return window.location.assign("/logout");
				}
				sessions = {
					state: "resolved",
					data: {
						currentSession: currentSession,
						otherSessions: result.filter(negateFn(isCurrentSession)),
					},
				};
			} catch (error) {
				sessions = { state: "failed", message: "Could not get the session details" };
			}

			try {
				isDefaultPassword = { state: "resolved", data: await data.isDefaultPassword };
			} catch (error) {
				isDefaultPassword = { state: "failed", message: "Could not get the password details" };
			}
		} catch (error) {
			details = { state: "failed", message: "Could not get the student details" };
		}
	});

	let canModifyOtherSessions = $derived.by(() => {
		if (sessions.state !== "resolved") return false;
		return (
			now - sessions.data.currentSession.createdAt.getTime() > SESSION_MODIFY_RESTRICTION_PERIOD
		);
	});

	// SESSIONS AND DEVICES SECTION
	function isCurrentSession(session: AccountSession) {
		return session.id === data.currentSessionId;
	}

	function sessionComparatorFn(a: AccountSession, b: AccountSession) {
		if (isCurrentSession(a)) return -1;
		return b.lastActive.getTime() - a.lastActive.getTime();
	}

	const formatter = new Intl.DateTimeFormat("en-IN", {
		dateStyle: "medium",
		timeStyle: "short",
	});
	let showLogoutDialog = $state(false);

	// PASSWORD SECTION
	let passwordSection: HTMLDivElement;
	const PASSWORD_KEYS = ["current", "password", "confirm"] as const;
	type PasswordKey = (typeof PASSWORD_KEYS)[number];
	let passwordInputs = $state<Record<PasswordKey, string>>({
		current: "",
		password: "",
		confirm: "",
	});
	const passwdStrSchema = z.string().min(6, "Too weak").max(128, "Too strong");
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
						{pluralize(details.data.enrollments.length, "subject", "subjects")}
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

<div class="space-y-4">
	<div class="text-xl">Sessions and Devices</div>

	{#if sessions.state === "pending"}
		<LoadingCard>{sessions.message}</LoadingCard>
	{:else if sessions.state === "resolved"}
		<div class="space-y-4">
			{#if !canModifyOtherSessions && sessions.data.otherSessions.length > 0}
				<div
					class="flex gap-2 rounded border border-error-border bg-error px-3 py-2 text-error-foreground"
				>
					<div>
						<AlertCircleIcon class="inline-block size-5" />
					</div>
					<div class="text-sm font-medium">
						You have to wait {timeDistance(
							now,
							sessions.data.currentSession.createdAt.getTime() + SESSION_MODIFY_RESTRICTION_PERIOD,
						)} before you can log out the other sessions from this session as you logged in very recently.
					</div>
				</div>
			{/if}

			{#snippet sessionCard(session: AccountSession)}
				{@const isCurrent = isCurrentSession(session)}

				<div
					class={clsx("flex gap-4 rounded border p-4", {
						"border-primary/50 bg-secondary bg-opacity-50": isCurrent,
					})}
				>
					<div class="aspect-square p-2">
						{#if session.deviceType === "laptop"}
							<LaptopIcon />
						{:else if session.deviceType === "mobile"}
							<SmartphoneIcon />
						{:else}
							<CircleHelpIcon />
						{/if}
					</div>
					<div>
						<div>{session.deviceInfo || "Unknown device"}</div>
						<div class="text-sm">
							{#if isCurrent}
								<div class="italic text-warning-foreground">This device</div>
							{:else}
								Last active {timeDistance(now, session.lastActive.getTime())} ago
							{/if}
						</div>
						<div class="mt-3 text-xs">
							Logged in on
							{formatter.format(session.createdAt)}
						</div>
						<div class="text-xs font-medium">
							Expires in
							{timeDistance(now, session.expiresAt.getTime())}
						</div>
					</div>

					{#if !isCurrent && sessions.state === "resolved"}
						<Button
							onclick={() => (showLogoutDialog = true)}
							disabled={!canModifyOtherSessions}
							variant={canModifyOtherSessions ? "destructive" : "secondary"}
							size="sm"
							class="my-auto ml-auto"
						>
							Logout
						</Button>
						<LogoutDialog
							bind:open={showLogoutDialog}
							{session}
							{canModifyOtherSessions}
							bind:sessions={sessions.data.otherSessions}
						/>
					{/if}
				</div>
			{/snippet}

			{@render sessionCard(sessions.data.currentSession)}

			<div class="space-y-2">
				<div class="text-sm uppercase">
					Other sessions ({sessions.data.otherSessions.length})
				</div>

				{#each sessions.data.otherSessions.toSorted(sessionComparatorFn) as session}
					{@render sessionCard(session)}
				{:else}
					<EmptyInfobox>You're not logged in anywhere else.</EmptyInfobox>
				{/each}

				<div class="text-sm text-muted-foreground">*Last active time is approximated.</div>
			</div>
		</div>
	{:else if sessions.state === "failed"}
		<LoadingFailedCard>{sessions.message}</LoadingFailedCard>
	{:else}
		<LoadingFailedCard>Unknown action.</LoadingFailedCard>
	{/if}
</div>

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
