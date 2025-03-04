import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import {
	demoteStudent,
	getSubjectRepresentatives,
	promoteStudent,
} from "$lib/server/db/representations";
import { and, eq } from "drizzle-orm";
import { notOk, ok } from "$lib/responses";
import type { Data, Payload } from "$lib/types";

export async function POST({ request, locals }) {
	if (locals.account == null || locals.session == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "administrator") return notOk("Forbidden", 401);

	if (request.headers.get("content-type") !== "application/json")
		return notOk("Invalid content type", 400);

	let data: Payload.ToggleRepresentative;
	try {
		data = await request.json();
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	if (data.action !== "demote" && data.action !== "promote") {
		return notOk("Unknown action specified: requires a valid action to invoke.", 400);
	}

	const [enrollment, representatives] = await Promise.all([
		db.query.enrollments.findFirst({
			where: () =>
				and(
					eq(schema.enrollments.studentId, data.studentId),
					eq(schema.enrollments.subjectId, data.subjectId),
				),
			with: { student: true },
		}),
		getSubjectRepresentatives(data.subjectId),
	]);

	if (enrollment == null) {
		return notOk("The student hasn't enrolled for the course.", 400);
	} else if (enrollment.student.batchId !== data.batchId) {
		return notOk("The student batch and subject batch are different.", 400);
	}

	const representative = representatives.find(
		(representative) => representative.student.id === data.studentId,
	);

	if (data.action === "promote") {
		// promote the student
		if (representative != null) {
			return notOk("The student is already a representative for the subject.", 400);
		}
		const promoted = await promoteStudent(data.subjectId, data.studentId);
		return ok<Data.ToggleRepresentative>({ status: "promoted", representative: promoted[0] }, 200);
	} else if (data.action === "demote") {
		// demote the student
		if (representative == null) {
			return notOk("The student is not a representative, can't demote.", 400);
		}

		const demoted = await demoteStudent(representative.id, data.subjectId, data.studentId);
		if (demoted.length === 0) {
			return notOk("Couldn't find the representation.", 404);
		}
		return ok<Data.ToggleRepresentative>({ status: "demoted", representative: demoted[0] }, 200);
	}

	return notOk("Unknown action.", 400);
}
