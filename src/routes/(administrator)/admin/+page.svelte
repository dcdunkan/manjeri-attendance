<script lang="ts">
	import {
		ArrowRightIcon,
		GraduationCapIcon,
		KeyRoundIcon,
		LogOutIcon,
		UsersIcon,
		type Icon as IconType,
	} from "lucide-svelte";
	import NavigationHeader from "../components/navigation-header.svelte";

	type MenuItem = {
		path: string;
		title: string;
		description: string;
		icon: typeof IconType;
	};

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

<NavigationHeader />

<div>
	<div class="text-lg">You're logged in as the&ndash;</div>
	<div class="truncate text-4xl font-medium">Administrator</div>
</div>

<div>
	This is your dashboard. You can choose one of the available sections shown below to view more
	regarding it.
</div>

<div>
	{#each menuItems as item}
		{@render menuItem(item)}
	{/each}
</div>
