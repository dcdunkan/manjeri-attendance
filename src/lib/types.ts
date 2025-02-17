/* eslint-disable @typescript-eslint/no-namespace */
import type * as schema from "$lib/server/db/schema";
import type { deletePeriod, getPeriod, getPeriods } from "./server/db/periods";

export namespace Payload {
	export interface ToggleRepresentative {
		batchId: number;
		studentId: number;
		subjectId: number;
		action: "promote" | "demote";
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
