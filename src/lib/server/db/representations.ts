import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";

export async function getSubjectRepresentatives(subjectId: number) {
	return await db.query.representatives.findMany({
		where: () => eq(schema.representatives.subjectId, subjectId),
		with: { student: true },
		columns: { id: true },
	});
}

export async function promoteStudent(subjectId: number, studentId: number) {
	return await db
		.insert(schema.representatives)
		.values({ studentId: studentId, subjectId: subjectId })
		.returning();
}

export async function demoteStudent(
	representativeId: number,
	subjectId: number,
	studentId: number,
) {
	return await db
		.delete(schema.representatives)
		.where(
			and(
				eq(schema.representatives.id, representativeId),
				eq(schema.representatives.subjectId, subjectId),
				eq(schema.representatives.studentId, studentId),
			),
		)
		.returning();
}
