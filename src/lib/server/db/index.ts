import { DATABASE_URL, ADMIN_LOGIN, ADMIN_PASSWORD } from "$env/static/private";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { and, eq, sql } from "drizzle-orm";
import { hashPassword } from "../auth";

const connectionString = DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const neonClient = neon(connectionString);
export const db = drizzle({ client: neonClient, casing: "snake_case", schema: schema });

// Setup the administrator account.
// TODO: refactor this shit.
(async () => {
	const results = await db.query.accounts.findMany({
		where: () => eq(schema.accounts.role, "administrator"),
	});
	if (results.length == 0) {
		console.log("Found no administrator account. Creating...");
		const hash = await hashPassword(ADMIN_PASSWORD);
		await db.insert(schema.accounts).values({
			login: ADMIN_LOGIN,
			passwordHash: hash,
			role: "administrator",
		});
	} else if (results.length > 1) {
		// shouldn't be happening, ONLY one.
		console.log("Found more than one administrator account. Deleting...");
		await db.delete(schema.accounts).where(eq(schema.accounts.role, "administrator"));
		const hash = await hashPassword(ADMIN_PASSWORD);
		await db.insert(schema.accounts).values({
			login: ADMIN_LOGIN,
			passwordHash: hash,
			role: "administrator",
		});
	} else if (results[0].login !== ADMIN_LOGIN) {
		console.log("Found administrator account that isn't matching. Fixing...");
		await db
			.update(schema.accounts)
			.set({ login: ADMIN_LOGIN })
			.where(eq(schema.accounts.id, results[0].id));
	}
	console.log("Setup administrator account successfully.");
})();

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

// okay, drizzle sucks
export async function getStudent(batchId: number, studentId: number) {
	return await db.query.students.findFirst({
		columns: { batchId: false },
		where: and(eq(schema.students.batchId, batchId), eq(schema.students.id, studentId)),
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
									schema.periods,
									// TODO: HACK: Drizzle db.$count bug which generates wrong query, when relational?
									// https://github.com/drizzle-team/drizzle-orm/issues/3564#issuecomment-2479782143
									// for future reference, .toSQL() and debug the SQL statements to correct and do the following:
									sql.raw(`"periods"."subject_id" = "students_enrollments_subject"."id"`),
								)
								.as("period_count"),
							asbentCount: db
								.$count(
									schema.absentees,
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
