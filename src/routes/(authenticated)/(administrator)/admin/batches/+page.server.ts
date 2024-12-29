import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { count, eq, getTableColumns } from "drizzle-orm";
import * as tables from "$lib/server/db/schema";

export const load: PageServerLoad = async () => {
	const batches = await db
		.select({
			...getTableColumns(tables.batches),
			studentCount: count(tables.students.id),
			subjectCount: count(tables.subjects.id),
		})
		.from(tables.batches)
		.leftJoin(tables.students, eq(tables.batches.id, tables.students.batchId))
		.leftJoin(tables.subjects, eq(tables.batches.id, tables.subjects.batchId))
		.groupBy(tables.batches.id);
	return { batches };
};
