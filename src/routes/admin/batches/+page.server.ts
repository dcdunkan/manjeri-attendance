import type { PageServerLoad } from "./$types";
import { getBatches } from "$lib/server/db/batches";

export const load: PageServerLoad = async () => {
	return {
		batches: getBatches(),
	};
};
