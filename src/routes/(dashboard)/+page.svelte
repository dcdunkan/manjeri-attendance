<script lang="ts">
	import type { PageData } from "./$types";
	import { CalendarCheck2Icon, LogOutIcon, UserCogIcon } from "lucide-svelte";
	import AttendanceCard from "./attendance-card.svelte";
	import { type MenuItem, default as Menu } from "$lib/components/menu-items.svelte";

	const menuItems: MenuItem[] = [
		{
			path: "/attendance",
			title: "Attendance",
			description: "Review attendance status of each subjects.",
			icon: CalendarCheck2Icon,
		},
		{
			path: "/account-settings",
			title: "Account Settings",
			description: "Review information, change password.",
			icon: UserCogIcon,
		},
		{
			path: "/logout",
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
	<div class="truncate text-4xl font-medium">{data.local.fullName}</div>
</div>

<div>
	This is your dashboard. You can choose one of the available sections shown below to view more
	regarding it.
</div>

<AttendanceCard />

<Menu items={menuItems} />
