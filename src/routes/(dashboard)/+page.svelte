<script lang="ts">
	import type { PageData, PageProps } from "./$types";
	import {
		ArrowLeftIcon,
		ArrowRightIcon,
		CalendarCheck2Icon,
		KeyRoundIcon,
		LogOutIcon,
		UserCogIcon,
	} from "lucide-svelte";
	import AttendanceCard from "./attendance-card.svelte";
	import { type MenuItem, default as Menu } from "$lib/components/menu-items.svelte";
	import { routes } from "$lib/constants";
	import { onMount } from "svelte";
	import type { LoadedData } from "$lib/types";
	import LoadingCard from "$lib/components/loading-card.svelte";
	import LoadingFailedCard from "$lib/components/loading-failed-card.svelte";
	import { slide } from "svelte/transition";

	let { data }: PageProps = $props();

	const menuItems: MenuItem[] = [
		{
			path: routes.attendance,
			title: "Attendance",
			description: "Review attendance status of each subjects.",
			icon: CalendarCheck2Icon,
		},
		{
			path: routes.accountSettings,
			title: "Account Settings",
			description: "Review information, change password.",
			icon: UserCogIcon,
		},
		{
			path: routes.logout,
			title: "Logout",
			description: "Log out of your account.",
			icon: LogOutIcon,
			preload: false,
		},
	];

	let details = $state<LoadedData<Awaited<typeof data.details>>>({
		state: "pending",
		message: "Loading student details...",
	});
	let isDefaultPassword = $state<LoadedData<boolean>>({ state: "pending", message: "" });

	onMount(async () => {
		try {
			details = { state: "resolved", data: await data.details };

			try {
				isDefaultPassword = { state: "resolved", data: await data.isDefaultPassword };
			} catch (error) {
				isDefaultPassword = { state: "failed", message: "Could not get the password details" };
			}
		} catch (err) {
			console.error(err);
			details = { state: "failed", message: "Failed to load student details." };
		}
	});
</script>

{#if isDefaultPassword.state === "resolved" && isDefaultPassword.data === true}
	<a
		transition:slide
		class="block rounded border border-error-border bg-error p-4 text-sm text-error-foreground"
		href="/account-settings"
	>
		<div class="flex place-items-center gap-4">
			<div>
				<KeyRoundIcon />
			</div>
			<div class="space-y-2">
				<div class="space-y-0.5">
					<div class="font-medium">Change your password</div>
					<div>
						Password change is highly recommended! Click here to go to the account settings to
						change your password.
					</div>
				</div>
			</div>
		</div>
	</a>
{/if}

<div>
	<div class="text-muted-foreground">You're logged in as</div>
	<div class="mt-1 truncate text-3xl">{data.local.fullName}</div>
</div>

{#if details.state === "pending"}
	<LoadingCard>{details.message}</LoadingCard>
{:else if details.state === "resolved"}
	<AttendanceCard attendanceData={details.data.attendance} />

	{#if details.data.representations.length > 0}
		<div>
			<div class="mb-4 space-y-2">
				You are a representative for the following subjects. Select one to update attendance for
				your batchmates.
			</div>
			<div class="grid grid-cols-2 gap-2">
				{#each details.data.representations as representation}
					<a href="/update-attendance/{representation.subjectId}">
						<div
							class="flex cursor-pointer select-none place-items-center justify-between rounded border p-4 transition-all duration-200 hover:border-primary/60 hover:bg-primary/5"
						>
							<div>{details.data.subjects[representation.subjectId].name}</div>
							<div><ArrowRightIcon class="size-5" /></div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<Menu items={menuItems} />
{:else if details.state === "failed"}
	<LoadingFailedCard>{details.message}</LoadingFailedCard>
{:else}
	<LoadingFailedCard>Unknown action.</LoadingFailedCard>
{/if}
