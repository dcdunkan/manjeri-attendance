import { redirect, type Handle } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";

const LOGIN_ROUTE = "/login";
const LOGOUT_ROUTE = "/logout";
const ADMIN_ROUTE = "/admin";
const STUDENT_ROUTE = "/dashboard";

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);
	if (!sessionToken) {
		event.locals.account = null;
		event.locals.session = null;
		if (event.url.pathname !== LOGIN_ROUTE) {
			// return redirect(303, LOGIN_ROUTE);
			return resolve(event);
		} else {
			return resolve(event);
		}
	}

	const { session, account } = await auth.validateSessionToken(sessionToken);
	if (session == null || account == null) {
		auth.deleteSessionTokenCookie(event);
		return redirect(303, LOGIN_ROUTE);
	}

	auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

	event.locals.account = account;
	event.locals.session = session;

	if (event.url.pathname === LOGIN_ROUTE) {
		switch (event.locals.account.role) {
			case "administrator":
				return redirect(303, ADMIN_ROUTE);
			case "student":
				return redirect(303, STUDENT_ROUTE);
			default:
				return redirect(303, LOGOUT_ROUTE);
		}
	}

	// The role must meet the route.
	if (event.url.pathname.startsWith(ADMIN_ROUTE)) {
		if (event.locals.account.role !== "administrator") {
			return redirect(303, STUDENT_ROUTE);
		}
	} else {
		if (event.locals.account.role !== "student") {
			return redirect(303, ADMIN_ROUTE);
		}
	}

	return resolve(event);
};
