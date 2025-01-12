import { DATABASE_URL } from "$env/static/private";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as s from "./schema";
import { and, eq, sql } from "drizzle-orm";

const connectionString = DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const neonClient = neon(connectionString);
export const db = drizzle({ client: neonClient, casing: "snake_case", schema: s });

export async function getBatches() {
	return await db.query.batches.findMany({
		extras: {
			subjectCount: db
				.$count(s.subjects, sql`subjects.batch_id = batches.id`.mapWith(Number))
				.mapWith(Number)
				.as("subject_count"),
			studentCount: db
				.$count(s.students, sql`students.batch_id = batches.id`.mapWith(Number))
				.mapWith(Number)
				.as("student_count"),
		},
	});
}

export async function getStudents(batchId: number) {
	return await db.query.students.findMany({
		where: () => eq(s.students.batchId, batchId),
		extras: {
			enrollments: db
				.$count(s.enrollments, sql`enrollments.student_id = students.id`.mapWith(Number))
				.mapWith(Number)
				.as("enrollments"),
		},
	});
}

export async function getBatchWithSubjects(batchId: number) {
	return await db.query.batches.findFirst({
		where: eq(s.batches.id, batchId),
		with: { subjects: true },
		extras: {
			studentCount: db
				.$count(s.students, sql`students.batch_id = batches.id`.mapWith(Number))
				.mapWith(Number)
				.as("student_count"),
		},
	});
}

// okay, drizzle sucks
export async function getStudent(batchId: number, studentId: number) {
	return await db.query.students.findFirst({
		columns: { batchId: false },
		where: and(eq(s.students.batchId, batchId), eq(s.students.id, studentId)),
		with: {
			account: {
				columns: {
					login: true,
				},
			},
			batch: true,
			enrollments: {
				columns: {
					subjectId: false,
					studentId: false,
				},
				with: {
					subject: {
						extras: {
							// BEWARE
							periodCount: db
								.$count(
									s.periods,
									// TODO: HACK: Drizzle db.$count bug which generates wrong query, when relational?
									// https://github.com/drizzle-team/drizzle-orm/issues/3564#issuecomment-2479782143
									// for future reference, .toSQL() and debug the SQL statements to correct and do the following:
									sql.raw(`"periods"."subject_id" = "students_enrollments_subject"."id"`),
								)
								.as("period_count"),
							asbentCount: db
								.$count(
									s.absentees,
									sql.raw(
										`"absentees"."subject_id" = "students_enrollments_subject"."id"
										AND "absentees"."student_id" = "students"."id"`,
									),
								)
								.as("absent_count"),
						},
						columns: { batchId: false },
					},
				},
			},
			representations: true,
		},
	});
}
