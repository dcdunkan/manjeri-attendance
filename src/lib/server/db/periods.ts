import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { and, eq, between, sql, inArray, asc } from "drizzle-orm";

export async function getPeriod(subjectId: number, periodId: number) {
	return await db.query.periods.findFirst({
		where: () => and(eq(schema.periods.id, periodId), eq(schema.periods.subjectId, subjectId)),
		columns: { subjectId: false },
		with: { absentees: { columns: { periodId: false, subjectId: false } } },
	});
}

export async function getPeriods(subjectId: number, startTime: Date, endTime: Date) {
	const subject = await db.query.subjects.findFirst({
		where: () => eq(schema.subjects.id, subjectId),
		extras: {
			totalPeriods: db
				.$count(schema.periods, sql`"periods"."subject_id" = ${subjectId}`.mapWith(Number))
				.as("total_periods"),
		},
		with: {
			periods: {
				where: between(schema.periods.date, startTime, endTime),
				with: { absentees: { columns: { periodId: false, subjectId: false } } },
			},
		},
	});

	if (subject == null) throw new Error("Subject not found");

	return {
		totalPeriods: Number(subject.totalPeriods),
		periods: subject.periods,
	};
}

export async function deletePeriod(subjectId: number, periodId: number) {
	const period = await db.query.periods.findFirst({
		where: () => and(eq(schema.periods.id, periodId), eq(schema.periods.subjectId, subjectId)),
		columns: { date: false, subjectId: false },
	});
	if (period == null) return null;

	const absentees = await db
		.delete(schema.absentees)
		.where(and(eq(schema.absentees.subjectId, subjectId), eq(schema.absentees.periodId, periodId)))
		.returning({ id: schema.absentees.studentId });

	await db
		.delete(schema.periods)
		.where(and(eq(schema.periods.subjectId, subjectId), eq(schema.periods.id, periodId)));

	return { deletedAbsentees: absentees };
}

export async function getMonthlyStudentPeriods(
	studentId: number,
	startDate: Date,
	endDate: Date,
	subjectIds: number[],
) {
	return await db.query.periods.findMany({
		where: () =>
			and(
				between(schema.periods.date, startDate, endDate),
				inArray(schema.periods.subjectId, subjectIds),
			),
		with: {
			absentees: {
				where: () => eq(schema.absentees.studentId, studentId),
				limit: 1,
				columns: {
					periodId: false,
					subjectId: false,
					studentId: false,
				},
			},
		},
		orderBy: [asc(schema.periods.date)],
	});
}
