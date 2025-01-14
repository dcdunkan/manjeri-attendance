import { getStudent } from "$lib/server/db";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async (event) => {
	const batchId = Number(event.params.id),
		studentId = Number(event.params.studentId);

	if (isNaN(batchId) || isNaN(studentId)) {
		return error(404, { message: "Not found" });
	}

	return {
		student: getStudent(batchId, studentId),
	};
};
