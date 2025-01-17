<script lang="ts">
	import type { PageData } from "./$types";
	import { CalendarCheck2Icon, CircleCheckIcon, LogOutIcon, UserCogIcon } from "lucide-svelte";
	import AttendanceCard from "./attendance-card.svelte";
	import { type MenuItem, default as Menu } from "$lib/components/menu-items.svelte";
	import DataLoader from "$lib/components/data-loader.svelte";
	import { routes } from "$lib/constants";

	const menuItems: MenuItem[] = [
		{
			path: routes.attendance,
			title: "Attendance",
			description: "Review attendance status of each subjects.",
			icon: CalendarCheck2Icon,
		},
		{
			path: routes.updateAttendance,
			title: "Update Attendance",
			description: "Update attendance of the subjects that you represent.",
			icon: CircleCheckIcon,
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

	let { data }: { data: PageData } = $props();
</script>

<div>
	<div class="text-lg">Hello there</div>
	<!-- TODO: algorithm for display name -->
	<div class="truncate text-4xl font-medium">{data.local.fullName}</div>
</div>

<div>
	This is your dashboard. You can choose one of the available sections shown below to view more
	regarding it.
</div>

<DataLoader promise={data.attendance}>
	{#snippet loadingMessage()}
		<div>Loading attendance overview...</div>
	{/snippet}

	{#snippet showData(attendanceData)}
		<AttendanceCard {attendanceData} />
	{/snippet}

	{#snippet errorMessage()}
		<div>Failed to load attendance overview.</div>
	{/snippet}
</DataLoader>

<Menu items={menuItems} />
