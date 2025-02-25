/* eslint-disable @typescript-eslint/no-namespace */
import type * as schema from "$lib/server/db/schema";
import type { getEnrolledStudents } from "./server/db/enrollments";
import type {
	deletePeriod,
	getMonthlyStudentPeriods,
	getPeriod,
	getPeriods,
} from "./server/db/periods";
import type { getSubjectRepresentatives } from "./server/db/representations";
import type { getAbsentPeriods } from "./server/db/students";

export namespace Payload {
	export interface ToggleRepresentative {
		batchId: number;
		studentId: number;
		subjectId: number;
		action: "promote" | "demote";
	}

	export interface UpdateSubjectName {
		subjectId: number;
		batchId: number;
		name: string;
	}

	export interface DelistEnrollment {
		subjectId: number;
		batchId: number;
		enrollmentId: number;
		studentId: number;
	}

	export namespace MarkAttendance {
		export interface POST {
			subjectId: number;
			date: string;
			absentees: number[];
		}
		export interface PATCH {
			periodId: number;
			subjectId: number;
			absentees: number[];
		}
	}

	export namespace EnrollStudents {
		export type GET = {
			batchId: number;
		};

		export type POST = {
			batchId: number;
			subjectId: number;
			enroll: number[];
			delist: number[];
		};
	}

	export interface ChangePassword {
		currentPassword: string;
		newPassword: string;
	}
}

export type Result<T = undefined> = { ok: false; reason: string } | { ok: true; data: T };

export namespace Data {
	export namespace Period {
		export type Get = NonNullable<AwaitReturn<typeof getPeriod>>;
		export type Delete = NonNullable<AwaitReturn<typeof deletePeriod>>;
	}

	export namespace Periods {
		export type GetAll = AwaitReturn<typeof getPeriods>;
	}

	export interface ToggleRepresentative {
		status: "promoted" | "demoted";
		representative: schema.Representative;
	}

	export interface MarkAttendance {
		periodId: number;
		absentees: {
			id: number;
			studentId: number;
		}[];
	}

	export interface DelistEnrollment {
		absentCount: number;
	}

	export namespace EnrollStudents {
		export type GET = {
			batchStudents: {
				id: number;
				fullName: string;
				rollNumber: number;
			}[];
			enrollments: AwaitReturn<typeof getEnrolledStudents>;
			representatives: AwaitReturn<typeof getSubjectRepresentatives>;
		};

		export type POST = {
			enrollments: { id: number; studentId: number }[];
			delists: { id: number; studentId: number }[];
			demoted: { id: number; studentId: number }[];
		};
	}

	export type MonthlyStudentPeriods = AwaitReturn<typeof getMonthlyStudentPeriods>;
	export type SubjectAbsentPeriods = AwaitReturn<typeof getAbsentPeriods>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AwaitReturn<T extends (...args: any[]) => unknown> = Awaited<ReturnType<T>>;

export type LoadedSuccess<T> = { state: "resolved"; data: T };
export type LoadedPending = { state: "pending"; message: string };
export type LoadedFailure = { state: "failed"; message: string };
export type LoadedData<T> = LoadedSuccess<T> | LoadedPending | LoadedFailure;

export type Keys<T extends Record<string, unknown>> = keyof T;
export type Values<T extends Record<string, unknown>> = T[keyof T];

export type ArrayIndices<
	T extends ReadonlyArray<unknown>,
	B = keyof T,
> = B extends `${infer N extends number}` ? N : never;

export type BaseDate = { year: number; month: number; date: number };
