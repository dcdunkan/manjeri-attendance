import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
	if (!event.locals.account || event.locals.account.role !== "administrator") {
		redirect(303, "/logout");
	}

	return {
		title: "Dashboard",
		showTitle: false,
	};
};
