<script lang="ts">
	import * as Table from "$lib/components/ui/table";

	const {
		batches,
	}: {
		batches: {
			studentCount: number;
			subjectCount: number;
			id: number;
			name: string;
		}[];
	} = $props();

	const total = batches.reduce(
		(prev, batch) => {
			return {
				students: prev.students + batch.studentCount,
				subjects: prev.subjects + batch.subjectCount,
			};
		},
		{ students: 0, subjects: 0 },
	);
</script>

<Table.Root>
	<Table.Caption>That's all.</Table.Caption>
	<Table.Header>
		<Table.Row>
			<Table.Head>Batch</Table.Head>
			<Table.Head class="text-right">Subjects</Table.Head>
			<Table.Head class="text-right">Students</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each batches as batch}
			<a
				href="batches/{batch.id}"
				class="table-row cursor-pointer border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
			>
				<Table.Cell class="font-medium">{batch.name}</Table.Cell>
				<Table.Cell class="text-right">{batch.subjectCount}</Table.Cell>
				<Table.Cell class="text-right">{batch.studentCount}</Table.Cell>
			</a>
		{/each}
	</Table.Body>
	<Table.Footer>
		<Table.Row>
			<Table.Cell colspan={1}>Total</Table.Cell>
			<Table.Cell class="text-right">{total.subjects}</Table.Cell>
			<Table.Cell class="text-right">{total.students}</Table.Cell>
		</Table.Row>
	</Table.Footer>
</Table.Root>
