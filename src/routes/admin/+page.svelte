<script lang="ts">
	import { LogOutIcon, UsersIcon } from "lucide-svelte";
	import { type MenuItem, default as Menu } from "$lib/components/menu-items.svelte";

	const menuItems: MenuItem[] = [
		{
			path: "/admin/batches",
			title: "Manage Batches",
			description: "Add or edit batches and subjects.",
			icon: UsersIcon,
		},
		{
			path: "/logout",
			title: "Logout",
			description: "Log out of your account.",
			icon: LogOutIcon,
			preload: false,
		},
	];
</script>

<div>
	<div class="text-muted-foreground">You're logged in as the&mdash;</div>
	<div class="mt-1 truncate text-3xl">Administrator</div>
</div>

<div>
	This is your dashboard. You can choose one of the available sections shown below to view more
	regarding it.
</div>

<div>
	<Menu items={menuItems} />
</div>
