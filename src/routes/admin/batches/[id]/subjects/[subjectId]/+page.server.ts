import { getEnrolledStudents } from "$lib/server/db/enrollments";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getSubject } from "$lib/server/db/subjects";

export const load: PageServerLoad = async (event) => {
	const batchId = Number(event.params.id),
		subjectId = Number(event.params.subjectId);

	if (isNaN(batchId) || isNaN(subjectId)) {
		return error(404, { message: "Not found" });
	}

	return {
		subject: getSubject(batchId, subjectId),
		students: getEnrolledStudents(batchId, subjectId),
	};
};
