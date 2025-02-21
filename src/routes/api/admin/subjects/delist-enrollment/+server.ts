import { notOk, ok } from "$lib/responses";
import { db } from "$lib/server/db/index";
import * as schema from "$lib/server/db/schema";
import type { Data } from "$lib/types.js";
import { and } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { z } from "zod";

const postSchema = z.object({
	subjectId: z.coerce.number(),
	batchId: z.coerce.number(),
	studentId: z.coerce.number(),
	enrollmentId: z.coerce.number(),
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
		const [absents, deletedEnrollments] = await Promise.all([
			db
				.delete(schema.absentees)
				.where(
					and(
						eq(schema.absentees.studentId, data.studentId),
						eq(schema.absentees.subjectId, data.subjectId),
					),
				)
				.returning({ id: schema.absentees.id }),
			db
				.delete(schema.enrollments)
				.where(
					and(
						eq(schema.enrollments.id, data.enrollmentId),
						eq(schema.enrollments.studentId, data.studentId),
						eq(schema.enrollments.subjectId, data.subjectId),
					),
				)
				.returning({ id: schema.enrollments.id }),
			db
				.delete(schema.representatives)
				.where(
					and(
						eq(schema.representatives.studentId, data.studentId),
						eq(schema.representatives.subjectId, data.subjectId),
					),
				),
		]);

		if (deletedEnrollments.length === 0) {
			return notOk("Failed to delete the enrollment", 400);
		} else if (deletedEnrollments.length === 1) {
			return ok<Data.DelistEnrollment>({ absentCount: absents.length });
		} else {
			console.error("Deleted more than one!", { enrollment: deletedEnrollments, absents });
			return notOk("Something went wrong", 500);
		}
	} catch (error) {
		console.error(error);
		return notOk("Couldn't delist the student.", 500);
	}
}
