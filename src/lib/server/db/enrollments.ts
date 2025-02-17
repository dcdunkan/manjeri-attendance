import { eq, sql } from "drizzle-orm";
import { db } from ".";
import * as schema from "./schema";

export async function getEnrolledStudents(batchId: number, subjectId: number) {
	return await db.query.enrollments.findMany({
		where: () => eq(schema.enrollments.subjectId, subjectId),
		columns: { studentId: false, subjectId: false },
		with: {
			student: {
				extras: {
					absentCount: db
						.$count(
							schema.absentees,
							sql
								.raw(
									`"absentees"."subject_id" = "enrollments"."subject_id"
                                  AND "absentees"."student_id" = "enrollments_student"."id"`,
								)
								.mapWith(Number),
						)
						.as("absent_count"),
				},
			},
		},
	});
}
