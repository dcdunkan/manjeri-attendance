<script lang="ts">
	import type { PageData } from "./$types";
	import { ArrowRightIcon, CalendarCheck2Icon, LogOutIcon, UserCogIcon } from "lucide-svelte";
	import AttendanceCard from "./attendance-card.svelte";
	import { type MenuItem, default as Menu } from "$lib/components/menu-items.svelte";
	import DataLoader from "$lib/components/data-loader.svelte";
	import { routes } from "$lib/constants";
	import NavigationHeader from "$lib/components/navigation-header.svelte";

	let { data }: { data: PageData } = $props();

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
</script>

<NavigationHeader title="Dashboard" />

<div class="mb-4">
	<div class="text-muted-foreground">You're logged in as</div>
	<!-- TODO: algorithm for display name, or just make an account setting? -->
	<div class="mt-1 truncate text-3xl">{data.local.fullName}</div>
</div>

<DataLoader promise={data.details}>
	{#snippet loadingMessage()}
		<div>Loading student details...</div>
	{/snippet}

	{#snippet showData({ attendance, representations, subjects })}
		<AttendanceCard attendanceData={attendance} />

		{#if representations.length > 0}
			<div>
				<div class="mb-4 space-y-2">
					<div class="font-medium text-muted-foreground">Update attendance</div>
					<p>
						Below are the subjects that you are a representative of. Choose one to update the
						attendance of your batchmates.
					</p>
				</div>
				<div class="grid grid-cols-2 gap-2">
					{#each representations as representation}
						<a href="/update-attendance/{representation.subjectId}">
							<div
								class="flex cursor-pointer select-none place-items-center justify-between rounded border p-4 transition-all duration-200 hover:border-primary/60 hover:bg-primary/5"
							>
								<div>{subjects[representation.subjectId].name}</div>
								<div><ArrowRightIcon /></div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<div>
			<div class="mb-4 space-y-2">
				<div class="font-medium text-muted-foreground">Student Menu</div>
				<p>You can choose one of the available sections shown below to view more regarding it.</p>
			</div>
			<Menu items={menuItems} />
		</div>
	{/snippet}

	{#snippet errorMessage()}
		<div>Failed to load student details.</div>
	{/snippet}
</DataLoader>
