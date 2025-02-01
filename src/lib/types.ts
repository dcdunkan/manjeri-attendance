/* eslint-disable @typescript-eslint/no-namespace */
import type * as schema from "$lib/server/db/schema";

export namespace Payload {
	export interface ToggleRepresentative {
		batchId: number;
		studentId: number;
		subjectId: number;
		action: "promote" | "demote";
	}
}

export type Result<T> = { ok: false; reason: string } | { ok: true; data: T };

export namespace Data {
	export interface ToggleRepresentative {
		status: "promoted" | "demoted";
		representative: schema.Representative;
	}
}
