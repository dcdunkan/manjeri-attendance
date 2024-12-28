<script lang="ts">
	import { GraduationCapIcon, KeyRoundIcon, LogOutIcon, UsersIcon } from "lucide-svelte";
	import { type MenuItem, default as Menu } from "$lib/components/menu-items.svelte";

	const menuItems: MenuItem[] = [
		{
			path: "/admin/batches",
			title: "Manage Batches",
			description: "Add or edit batches.",
			icon: UsersIcon,
		},
		{
			path: "/admin/students",
			title: "Manage Students",
			description: "Manage student accounts and subjects.",
			icon: GraduationCapIcon,
		},
		{
			path: "/admin/representatives",
			title: "Manage Representatives",
			description: "Promote and demote representatives.",
			icon: KeyRoundIcon,
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
	<div class="text-lg">You're logged in as the&ndash;</div>
	<div class="truncate text-4xl font-medium">Administrator</div>
</div>

<div>
	This is your dashboard. You can choose one of the available sections shown below to view more
	regarding it.
</div>

<div>
	<Menu items={menuItems} />
</div>
