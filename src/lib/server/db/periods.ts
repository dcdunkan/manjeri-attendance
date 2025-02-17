import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { and, eq, between, sql } from "drizzle-orm";

export async function getPeriod(subjectId: number, periodId: number) {
	return await db.query.periods.findFirst({
		where: () => and(eq(schema.periods.id, periodId), eq(schema.periods.subjectId, subjectId)),
		columns: { subjectId: false },
		with: { absentees: { columns: { periodId: false, subjectId: false } } },
	});
}

export async function getPeriods(subjectId: number, startTime: Date, endTime: Date) {
	const periods = await db.query.periods.findMany({
		where: () =>
			and(
				eq(schema.periods.subjectId, subjectId),
				between(schema.periods.date, startTime, endTime),
			),
		extras: {
			totalPeriods: db
				.$count(schema.periods, sql`"periods"."subject_id" = ${subjectId}`.mapWith(Number))
				.as("total_periods"),
		},
		with: { absentees: { columns: { periodId: false, subjectId: false } } },
	});

	const totalPeriods = periods.length > 0 ? Number(periods[0].totalPeriods) : 0;
	return {
		totalPeriods,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		periods: periods.map(({ totalPeriods, ...period }) => period),
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
