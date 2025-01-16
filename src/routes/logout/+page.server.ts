import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as auth from "$lib/server/auth";

export const load: PageServerLoad = async (event) => {
	if (!event.locals.session) {
		return redirect(307, "/login");
	}

	await auth.invalidateSession(event.locals.session.id);
	auth.deleteSessionTokenCookie(event);

	event.locals.session = null;
	event.locals.account = null;

	return redirect(307, "/login");
};
