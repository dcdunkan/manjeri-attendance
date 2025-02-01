import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function getSubject(batchId: number, subjectId: number) {
	const subject = await db.query.subjects.findFirst({
		where: () => and(eq(schema.subjects.batchId, batchId), eq(schema.subjects.id, subjectId)),
		columns: { name: true, id: true },
		with: {
			batch: true,
			representatives: {
				with: { student: { columns: { fullName: true } } },
			},
		},
		extras: {
			enrollmentCount: db
				.$count(schema.enrollments, sql.raw(`"enrollments"."subject_id" = "subjects"."id"`))
				.as("enrollment_count"),
			periodCount: db
				.$count(schema.periods, sql.raw(`"periods"."subject_id" = "subjects"."id"`))
				.as("period_count"),
		},
	});
	if (subject == null) throw new Error("Couldn't find the subject.");
	return subject;
}
