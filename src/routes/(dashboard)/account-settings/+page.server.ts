import { getStudent, isUnsafePasswordSaved } from "$lib/server/db/students";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
	if (locals.account?.role !== "student" || locals.account.student == null) {
		return error(403, "Forbidden");
	}

	return {
		student: getStudent(locals.account.student.batchId, locals.account.student.id),
		isDefaultPassword: isUnsafePasswordSaved(locals.account.id),
	};
};
