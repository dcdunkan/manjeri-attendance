<script lang="ts">
	import { goto } from "$app/navigation";
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
</script>

<Table.Root>
	<!-- <Table.Caption>That's all.</Table.Caption> -->
	<Table.Header>
		<Table.Row>
			<Table.Head>Batch</Table.Head>
			<Table.Head class="text-right">Subjects</Table.Head>
			<Table.Head class="text-right">Students</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each batches as batch}
			<Table.Row
				onclick={() => goto(`batches/${batch.id}`)}
				class="table-row cursor-pointer border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
			>
				<Table.Cell class="font-medium">{batch.name}</Table.Cell>
				<Table.Cell class="text-right">{batch.subjectCount}</Table.Cell>
				<Table.Cell class="text-right">{batch.studentCount}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
