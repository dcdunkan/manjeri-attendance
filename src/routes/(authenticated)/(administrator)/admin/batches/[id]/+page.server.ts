import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { count, eq } from "drizzle-orm";
import * as tables from "$lib/server/db/schema";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async (event) => {
	const batchId = Number(event.params.id);

	if (isNaN(batchId)) {
		return error(404, { message: "Not found" });
	}

	// const [batch] = await db
	// 	.select({
	// 		...getTableColumns(tables.batches),
	// 		subjects: tables.subjects,
	// 		studentCount: count(tables.students.id),
	// 	})
	// 	.from(tables.batches)
	// 	.where(eq(tables.batches.id, batchId))
	// 	.fullJoin(tables.subjects, eq(tables.batches.id, tables.subjects.batchId))
	// 	.leftJoin(tables.students, eq(tables.batches.id, tables.students.batchId))
	// 	.groupBy(tables.batches.id, tables.subjects.id);

	const [batchResult, [countResult]] = await Promise.all([
		db.query.batches.findFirst({
			where: eq(tables.batches.id, batchId),
			with: { subjects: true },
		}),
		db
			.select({ count: count(tables.students.id) })
			.from(tables.students)
			.where(eq(tables.students.batchId, batchId)),
	]);

	if (batchResult == null) {
		return error(404, { message: "Not found" });
	}

	return {
		batch: {
			...batchResult,
			studentCount: countResult.count,
		},
	};
};

// export const load: PageServerLoad = async () => {
// 	const batches = await db
// 		.select({
// 			...getTableColumns(tables.batches),
// 			subjects: tables.subjects,
// 			studentCount: count(tables.students.id),
// 		})
// 		.from(tables.batches)
// 		.leftJoin(tables.subjects, eq(tables.batches.id, tables.subjects.batchId))
// 		.leftJoin(tables.students, eq(tables.batches.id, tables.students.batchId))
// 		.groupBy(tables.batches.id, tables.subjects.id);

// 	const transformed = batches.reduce(
// 		(prev, { subjects, ...batch }) => {
// 			if (prev[batch.id] == null) {
// 				prev[batch.id] = {
// 					id: batch.id,
// 					name: batch.name,
// 					studentCount: batch.studentCount,
// 					subjects: [],
// 				};
// 			}
// 			if (subjects != null) {
// 				prev[batch.id].subjects.push(subjects);
// 			}
// 			return prev;
// 		},
// 		{} as Record<
// 			number,
// 			tables.Batch & {
// 				studentCount: number;
// 				subjects: tables.Subject[];
// 			}
// 		>,
// 	);

// 	return {
// 		batches: Object.values(transformed),
// 	};
// };
