import { redirect, type Handle } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import { routes } from "$lib/constants";

export const handle: Handle = async ({ event, resolve }) => {
	const route = event.url.pathname;

	console.log(event.request.method, route);

	const sessionToken = event.cookies.get(auth.sessionCookieName);
	if (!sessionToken) {
		event.locals.account = null;
		event.locals.session = null;
		if (route !== routes.login) {
			return redirect(303, routes.login);
		} else {
			return resolve(event);
		}
	}

	const { session, account } = await auth.validateSessionToken(sessionToken);
	if (session == null || account == null) {
		auth.deleteSessionTokenCookie(event);
		return redirect(303, routes.login);
	}

	auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	event.locals.account = account;
	event.locals.session = session;

	if (route === routes.logout) {
		return resolve(event);
	}

	if (route === routes.login) {
		switch (event.locals.account.role) {
			case "administrator":
				return redirect(303, routes.administrator);
			case "student":
				return redirect(303, routes.dashboard);
			default:
				return redirect(303, routes.logout);
		}
	}

	// The role must meet the route.
	// If it starts with the administrator route's root:
	if (route.startsWith(routes.administrator)) {
		if (event.locals.account.role !== "administrator") {
			return redirect(303, routes.dashboard);
		}
	} else {
		// Administrator isn't allowed to use those student routes either.
		// Which is everything except $constants/routes.administrator.
		if (event.locals.account.role !== "student") {
			return redirect(303, routes.administrator);
		}
	}

	return resolve(event);
};
