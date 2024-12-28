<script lang="ts">
	import * as Breadcrumb from "$lib/components/ui/breadcrumb";

	import { page } from "$app/state";

	const segments = page.url.pathname
		.split("/")
		.map((segment) => segment.trim())
		.filter((segment) => segment.length > 0);

	const SEGMENT_TITLES: Record<string, string> = {
		admin: "Dashboard",
		batches: "Batches",
		students: "Students",
		representatives: "Representatives",
	};

	const PAGE_TITLES: Record<string, string> = {
		// ADMINISTRATOR
		"/admin": "Dashboard",
		"/admin/batches": "Batches",
		"/admin/batches/new": "New Batch",
		"/admin/students": "Students",
		"/admin/representatives": "Representatives",
		// STUDENT
		"/dashboard": "Dashboard",
	};
</script>

{#if segments.length >= 1}
	<Breadcrumb.Root>
		<Breadcrumb.List>
			{#each segments as segment, i (i)}
				{#if i === segments.length - 1}
					<Breadcrumb.Item>
						<Breadcrumb.Page>{PAGE_TITLES[page.url.pathname]}</Breadcrumb.Page>
					</Breadcrumb.Item>
				{:else}
					<Breadcrumb.Item class="hidden sm:block">
						<Breadcrumb.Link href={"/" + segments.slice(0, i + 1).join("/")}
							>{SEGMENT_TITLES[segment]}</Breadcrumb.Link
						>
					</Breadcrumb.Item>

					<Breadcrumb.Separator class="hidden sm:block" />
				{/if}
			{/each}
		</Breadcrumb.List>
	</Breadcrumb.Root>
{/if}

<!-- TODO: by default on mobile must show the Go back button, only show breadcrumbs on desk -->
