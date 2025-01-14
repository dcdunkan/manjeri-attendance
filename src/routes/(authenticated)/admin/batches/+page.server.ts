import type { PageServerLoad } from "./$types";
import { getBatches } from "$lib/server/db";

export const load: PageServerLoad = async () => {
	return {
		batches: getBatches(),
	};
};
