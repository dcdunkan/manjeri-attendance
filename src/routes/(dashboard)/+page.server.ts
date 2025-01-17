import { getStudent } from "$lib/server/db/students";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
	if (!event.locals.account || event.locals.account.role !== "student") {
		return redirect(303, "/logout");
	}

	const { batchId, id } = event.locals.account.student;

	return {
		local: event.locals.account.student,
		details: getStudent(batchId, id),
	};
};
