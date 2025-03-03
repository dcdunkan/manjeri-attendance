import { getStudent } from "$lib/server/db/students";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async (event) => {
	const batchId = Number(event.params.id),
		studentId = Number(event.params.studentId);

	if (isNaN(batchId) || isNaN(studentId)) {
		return error(404, { message: "Not found" });
	}

	return {
		title: "Student Details",
		backwards: `/admin/batches/${batchId}/students`,
		student: getStudent(batchId, studentId),
	};
};
