<script lang="ts">
	import {
		ArrowRightIcon,
		CalendarCheck2Icon,
		LogOutIcon,
		UserCogIcon,
		type Icon as IconType,
	} from "lucide-svelte";
	import AttendanceCard from "./components/attendance-card.svelte";

	type MenuItem = {
		path: string;
		title: string;
		description: string;
		icon: typeof IconType;
	};

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

{#snippet menuItem(item: MenuItem)}
	<a href={item.path}>
		<div
			class="flex place-items-center justify-between gap-4 border-b-2 border-transparent px-2 py-4 transition-all duration-200 hover:border-primary"
		>
			<div class="flex gap-4">
				<div class="pt-2"><svelte:component this={item.icon} /></div>
				<div>
					<div class="font-medium">{item.title}</div>
					<div class="text-sm">{item.description}</div>
				</div>
			</div>
			<div><ArrowRightIcon /></div>
		</div></a
	>
{/snippet}

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
	{#each menuItems as item}
		{@render menuItem(item)}
	{/each}
</div>
