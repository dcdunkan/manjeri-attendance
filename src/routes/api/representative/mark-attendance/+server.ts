import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { notOk, ok } from "$lib/responses";
import { z } from "zod";
import type { Data } from "$lib/types";
import { deletePeriod } from "$lib/server/db/periods.js";

const postSchema = z.object({
	subjectId: z.number({ message: "Subject ID is invalid" }),
	date: z.coerce.date({ message: "Invalid date" }),
	absentees: z.array(z.number({ message: "Student ID is invalid" })),
});

export async function POST({ request, locals }) {
	if (locals.account == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "student" || locals.account.student == null)
		return notOk("Forbidden", 401);

	if (request.headers.get("content-type") !== "application/json")
		return notOk("Invalid content type", 400);

	let data: z.infer<typeof postSchema>;
	try {
		const json = await request.json();
		const parsed = postSchema.safeParse(json);
		if (!parsed.success) {
			return notOk(parsed.error.issues[0]?.message ?? "Invalid inputs!", 400);
		}
		data = parsed.data;
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	const representativeId = locals.account.student.id;
	const representative = await db.query.representatives.findFirst({
		where: () =>
			and(
				eq(schema.representatives.studentId, representativeId),
				eq(schema.representatives.subjectId, data.subjectId),
			),
	});
	if (representative == null) {
		return notOk("Authorized user is not a representative for the subject", 403);
	}

	const [period] = await db
		.insert(schema.periods)
		.values({ subjectId: data.subjectId, date: data.date })
		.returning({ id: schema.periods.id });

	if (period == null) {
		return notOk("Failed to create period", 500);
	}

	const absentees =
		data.absentees.length > 0
			? await db
					.insert(schema.absentees)
					.values(
						data.absentees.map((absentee) => ({
							periodId: period.id,
							studentId: absentee,
							subjectId: data.subjectId,
						})),
					)
					.returning({ id: schema.absentees.id, studentId: schema.absentees.studentId })
			: [];

	return ok<Data.MarkAttendance>({ periodId: period.id, absentees: absentees });
}

const patchSchema = z.object({
	subjectId: z.number({ message: "Subject ID is invalid" }),
	periodId: z.number({ message: "Period ID is invalid" }),
	absentees: z.array(z.number({ message: "Student ID is invalid" })),
});

export async function PATCH({ request, locals }) {
	if (locals.account == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "student" || locals.account.student == null)
		return notOk("Forbidden", 401);

	if (request.headers.get("content-type") !== "application/json")
		return notOk("Invalid content type", 400);

	let data: z.infer<typeof patchSchema>;
	try {
		const json = await request.json();
		const parsed = patchSchema.safeParse(json);
		if (!parsed.success) {
			return notOk(parsed.error.issues[0]?.message ?? "Invalid inputs!", 400);
		}
		data = parsed.data;
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	const representativeId = locals.account.student.id;
	const representative = await db.query.representatives.findFirst({
		where: () =>
			and(
				eq(schema.representatives.studentId, representativeId),
				eq(schema.representatives.subjectId, data.subjectId),
			),
	});
	if (representative == null) {
		return notOk("Authorized user is not a representative for the subject", 403);
	}

	const period = await db.query.periods.findFirst({
		where: () => eq(schema.periods.id, data.periodId),
		with: { absentees: { columns: { id: true, studentId: true } } },
	});
	if (period == null) {
		return notOk(`Could not find period with ID ${data.periodId}`, 500);
	}

	const storedAbsentees = new Set(period.absentees.map((a) => a.studentId));
	const updatedAbsentees = new Set(data.absentees);

	const studentIdsToDelete = storedAbsentees.difference(updatedAbsentees),
		studentIdsToInsert = updatedAbsentees.difference(storedAbsentees);

	const [deleted, inserted] = await Promise.all([
		studentIdsToDelete.size > 0
			? db
					.delete(schema.absentees)
					.where(
						and(
							inArray(schema.absentees.studentId, Array.from(studentIdsToDelete)),
							eq(schema.absentees.periodId, data.periodId),
						),
					)
					.returning({ id: schema.absentees.id, studentId: schema.absentees.studentId })
			: [],
		studentIdsToInsert.size > 0
			? db
					.insert(schema.absentees)
					.values(
						Array.from(studentIdsToInsert).map((absentee) => ({
							periodId: period.id,
							studentId: absentee,
							subjectId: data.subjectId,
						})),
					)
					.returning({ id: schema.absentees.id, studentId: schema.absentees.studentId })
			: [],
	]);

	const absentees = period.absentees
		.filter((old) => !deleted.some((absentee) => absentee.id === old.id))
		.concat(inserted);

	return ok<Data.MarkAttendance>({ periodId: period.id, absentees: absentees });
}

const deleteSchema = z.object({
	subjectId: z.coerce.number({
		required_error: "Subject ID is required",
		invalid_type_error: "Subject ID is invalid",
	}),
	periodId: z.coerce.number({
		required_error: "Period ID is required",
		invalid_type_error: "Period ID is invalid",
	}),
});

export async function DELETE({ request }) {
	const { searchParams } = new URL(request.url);
	const parsed = deleteSchema.safeParse(Object.fromEntries(searchParams));
	if (!parsed.success) {
		return notOk(parsed.error.issues[0]?.message ?? "Invalid inputs!", 400);
	}

	const { subjectId, periodId } = parsed.data;

	try {
		// TODO: split deletePeriod into getPeriod, deleteAbsentees, and deletePeriod.
		const period = await deletePeriod(subjectId, periodId);
		if (period == null) return notOk("Period data not found", 400);
		return ok<Data.Period.Delete>(period);
	} catch (error) {
		console.error(error);
		return notOk("Internal Server Error.", 501);
	}
}
