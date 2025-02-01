import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
	return redirect(303, event.url.pathname.split("/").slice(0, -1).join("/"));
};
