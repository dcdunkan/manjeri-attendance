import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { verifyHash } from "$lib/server/auth";

export async function getStudents(batchId: number) {
	return await db.query.students.findMany({
		where: () => eq(schema.students.batchId, batchId),
		extras: {
			enrollments: db
				.$count(schema.enrollments, sql`enrollments.student_id = students.id`.mapWith(Number))
				.mapWith(Number)
				.as("enrollments"),
		},
	});
}

// okay, drizzle sucks
export async function getStudent(batchId: number, studentId: number) {
	return await db.query.students.findFirst({
		columns: { batchId: false },
		where: and(eq(schema.students.batchId, batchId), eq(schema.students.id, studentId)),
		with: {
			account: {
				columns: {
					login: true,
					passwordHash: false,
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
									schema.periods,
									// HACK: Drizzle db.$count bug which generates wrong query, when relational?
									// https://github.com/drizzle-team/drizzle-orm/issues/3564#issuecomment-2479782143
									// for future reference, .toSQL() and debug the SQL statements to correct and do the following:
									sql.raw(`"periods"."subject_id" = "students_enrollments_subject"."id"`),
									// NOTE: quick not on how the `students_enrollments_subject` is created:
									// `students` is the table which is queried. so, `students`.
									// `students` with: `enrollments` => `students_enrollments`
									// `students` with: `enrollments` with: `subject` => `students_enrollments_subject`
									// (note added for future reference)
								)
								.mapWith(Number)
								.as("period_count"),
							asbentCount: db
								.$count(
									schema.absentees,
									sql.raw(
										`"absentees"."subject_id" = "students_enrollments_subject"."id"
										AND "absentees"."student_id" = "students"."id"`,
									),
								)
								.mapWith(Number)
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

export async function getAbsentPeriods(studentId: number, subjectId: number) {
	return await db
		.select({
			id: schema.absentees.id,
			period: { id: schema.periods.id, date: schema.periods.date },
		})
		.from(schema.absentees)
		.where(
			and(eq(schema.absentees.studentId, studentId), eq(schema.absentees.subjectId, subjectId)),
		)
		.innerJoin(schema.periods, eq(schema.absentees.periodId, schema.periods.id))
		.orderBy(desc(schema.periods.date));

	// TODO: NOTE:
	// Realisitically, people won't have a lot of absentees, that a single network request can't handle.
	// When this needs to be implemented (which requires changes in the fetching part) uncomment this:
	// .limit(10)
	// .offset((page - 1) * 10);

	// return await db.query.absentees.findMany({
	// 	where: () =>
	// 		and(eq(schema.absentees.studentId, studentId), eq(schema.absentees.subjectId, subjectId)),
	// 	columns: { id: true },
	// 	with: { period: { columns: { subjectId: false } } },
	// 	orderBy: [desc(schema.periods.date)],
	// });
}

export async function isUnsafePasswordSaved(accountId: number) {
	const [account] = await db
		.select({
			login: schema.accounts.login,
			passwordHash: schema.accounts.passwordHash,
		})
		.from(schema.accounts)
		.where(eq(schema.accounts.id, accountId));
	if (account == null) return false;
	return await verifyHash(account.passwordHash, account.login);
}
