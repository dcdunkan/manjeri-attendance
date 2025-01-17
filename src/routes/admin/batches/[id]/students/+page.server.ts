import type { PageServerLoad } from "./$types";
import { getStudents } from "$lib/server/db/students";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async (event) => {
	const batchId = Number(event.params.id);

	if (isNaN(batchId)) {
		return error(404, { message: "Not found" });
	}

	return {
		students: getStudents(batchId),
	};
};
