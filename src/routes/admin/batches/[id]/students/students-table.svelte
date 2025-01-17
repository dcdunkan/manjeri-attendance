<script lang="ts">
	import { goto } from "$app/navigation";
	import * as Table from "$lib/components/ui/table";
	import type { getStudents } from "$lib/server/db/students";

	const { students }: { students: Awaited<ReturnType<typeof getStudents>> } = $props();
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>ID</Table.Head>
			<Table.Head>Student Name</Table.Head>
			<Table.Head>Roll number</Table.Head>
			<Table.Head class="text-right">Enrollments</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each students as student}
			<Table.Row
				onclick={() => goto(`students/${student.id}`)}
				class="table-row cursor-pointer border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
			>
				<Table.Cell class="font-medium">{student.id}</Table.Cell>
				<Table.Cell>{student.fullName}</Table.Cell>
				<Table.Cell>{student.rollNumber}</Table.Cell>
				<Table.Cell class="text-right">{student.enrollments}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
