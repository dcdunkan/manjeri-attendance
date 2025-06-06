import type { PageServerLoad } from "./$types";
import { getBatchWithSubjects } from "$lib/server/db/batches";
import { error } from "@sveltejs/kit";

export const load = async (event: Parameters<PageServerLoad>[0]) => {
	const batchId = Number(event.params.id);

	if (isNaN(batchId)) {
		return error(404, { message: "Not found" });
	}

	return {
		title: "Batch Details",
		backwards: "/admin/batches",
		batch: getBatchWithSubjects(batchId),
	};
};
