import { notOk, ok } from "$lib/responses";
import { getEnrolledStudents } from "$lib/server/db/enrollments.js";
import { db } from "$lib/server/db/index";
import { getSubjectRepresentatives } from "$lib/server/db/representations.js";
import * as schema from "$lib/server/db/schema";
import type { Data } from "$lib/types.js";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

const getSchema = z.object({
	batchId: z.coerce.number(),
	subjectId: z.coerce.number(),
});

export async function GET({ request, locals }) {
	if (locals.account == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "administrator") return notOk("Forbidden", 401);

	let data: z.infer<typeof getSchema>;
	try {
		const { searchParams } = new URL(request.url);
		const params = Object.fromEntries(searchParams.entries());
		const parsed = getSchema.safeParse(params);
		if (!parsed.success) return notOk(parsed.error.message, 400);
		data = parsed.data;
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	try {
		const students = await db
			.select({
				id: schema.students.id,
				fullName: schema.students.fullName,
				rollNumber: schema.students.rollNumber,
			})
			.from(schema.students)
			.where(eq(schema.students.batchId, data.batchId));

		return ok<Data.EnrollStudents.GET>({
			batchStudents: students,
			enrollments: await getEnrolledStudents(data.batchId, data.subjectId),
			representatives: await getSubjectRepresentatives(data.subjectId),
		});
	} catch (error) {
		console.error(error);
		return notOk("Something went wrong", 500);
	}
}

const postSchema = z.object({
	batchId: z.number(),
	subjectId: z.number(),
	enroll: z.array(z.number()),
	delist: z.array(z.number()),
});

export async function POST({ request, locals }) {
	if (locals.account == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "administrator") return notOk("Forbidden", 401);

	if (request.headers.get("content-type") !== "application/json")
		return notOk("Invalid content type", 400);

	let data: z.infer<typeof postSchema>;
	try {
		const json = await request.json();
		const parsed = postSchema.safeParse(json);
		if (!parsed.success) return notOk(parsed.error.message, 400);
		data = parsed.data;
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	try {
		if (data.delist.length > 0) {
			await db
				.delete(schema.absentees)
				.where(
					and(
						eq(schema.absentees.subjectId, data.subjectId),
						inArray(schema.absentees.studentId, data.delist),
					),
				);
		}

		const demotedReps =
			data.delist.length > 0 &&
			(await db
				.delete(schema.representatives)
				.where(
					and(
						eq(schema.representatives.subjectId, data.subjectId),
						inArray(schema.representatives.studentId, data.delist),
					),
				)
				.returning({
					id: schema.representatives.id,
					studentId: schema.representatives.studentId,
				}));

		const [enrollments, delists] = await Promise.all([
			data.enroll.length > 0 &&
				db
					.insert(schema.enrollments)
					.values(data.enroll.map((id) => ({ studentId: id, subjectId: data.subjectId })))
					.returning({
						id: schema.enrollments.id,
						studentId: schema.enrollments.studentId,
					}),
			data.delist.length > 0 &&
				db
					.delete(schema.enrollments)
					.where(
						and(
							eq(schema.enrollments.subjectId, data.subjectId),
							inArray(schema.enrollments.studentId, data.delist),
						),
					)
					.returning({ id: schema.enrollments.id, studentId: schema.enrollments.studentId }),
		]);

		return ok<Data.EnrollStudents.POST>({
			enrollments: enrollments
				? enrollments.map((enrollment) => ({ id: enrollment.id, studentId: enrollment.studentId }))
				: [],
			delists: delists
				? delists.map((delist) => ({ id: delist.id, studentId: delist.studentId }))
				: [],
			demoted: demotedReps
				? demotedReps.map((rep) => ({ id: rep.id, studentId: rep.studentId }))
				: [],
		});
	} catch (error) {
		console.error(error);
		return notOk("Something went wrong", 500);
	}
}
