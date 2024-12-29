<script lang="ts">
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
		},
	];
</script>

<div>
	<div class="text-lg">Hello there</div>
	<div class="truncate text-4xl font-medium">Sheron Rajesh</div>
</div>

<div>
	This is your dashboard. You can choose one of the available sections shown below to view more
	regarding it.
</div>

<AttendanceCard />

<div>
	<Menu items={menuItems} />
</div>
