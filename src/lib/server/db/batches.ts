import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getBatches() {
	return await db.query.batches.findMany({
		extras: {
			subjectCount: db
				.$count(schema.subjects, sql`subjects.batch_id = batches.id`.mapWith(Number))
				.mapWith(Number)
				.as("subject_count"),
			studentCount: db
				.$count(schema.students, sql`students.batch_id = batches.id`.mapWith(Number))
				.mapWith(Number)
				.as("student_count"),
		},
	});
}

export async function getBatchWithSubjects(batchId: number) {
	return await db.query.batches.findFirst({
		where: eq(schema.batches.id, batchId),
		with: { subjects: true },
		extras: {
			studentCount: db
				.$count(schema.students, sql`students.batch_id = batches.id`.mapWith(Number))
				.mapWith(Number)
				.as("student_count"),
		},
	});
}
