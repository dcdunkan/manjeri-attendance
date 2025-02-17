import type { getEnrolledStudents } from "$lib/server/db/enrollments";
import type { getSubject } from "$lib/server/db/subjects";
import type { AwaitReturn, Data, Values } from "$lib/types";

export const sections = {
	overview: {
		id: "overview",
		label: "Overview",
		description: "Get overall attendance details.",
	},
	history: {
		id: "history",
		label: "History",
		description: "Analyse detailed history.",
	},
} as const;
export type Section = Values<typeof sections>;

export type Subject = AwaitReturn<typeof getSubject>;
export type EnrolledStudent = AwaitReturn<typeof getEnrolledStudents>[number]["student"];

export type Period = Data.Periods.GetAll["periods"][number];

export type CacheMonthlyData = Record<number, Omit<Period, "date" | "subjectId">[]>;
