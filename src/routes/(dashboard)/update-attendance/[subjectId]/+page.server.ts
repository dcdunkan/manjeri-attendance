import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getSubject } from "$lib/server/db/subjects";
import { getEnrolledStudents } from "$lib/server/db/enrollments";

export const load: PageServerLoad = async ({ params, locals }) => {
	if (locals.account?.role !== "student" || locals.account.student.batchId == null) {
		return error(403, "Forbidden");
	}

	const batchId = Number(locals.account.student.batchId);
	const subjectId = Number(params.subjectId);

	if (isNaN(subjectId)) {
		return error(404, { message: "Not found" });
	}

	return {
		subject: getSubject(batchId, subjectId),
		students: getEnrolledStudents(batchId, subjectId),
	};
};
