import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { formSchema } from "./login-form.svelte";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { and, eq } from "drizzle-orm";
import * as tables from "$lib/server/db/schema";
import { ADMIN_LOGIN, ADMIN_PASSWORD } from "$env/static/private";
import * as auth from "$lib/server/auth";
import { Argon2id } from "oslo/password";

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod(formSchema)),
	};
};

export const actions: Actions = {
	login: async (event) => {
		const form = await superValidate(event, zod(formSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		// TODO: trim the inputs.
		const { userId, password } = form.data;

		// TODO: So, admin accounts are useless as of now.
		if (userId === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
			// Abstract this into a function and add all the admin account setup actions there.
			const account = await db.query.accounts.findFirst({
				where: () => {
					return and(
						eq(tables.accounts.login, ADMIN_LOGIN),
						eq(tables.accounts.role, "administrator"),
					);
				},
			});
			if (account == null) {
				return fail(400, { message: "Incorrect username or password" });
			}
			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, account.id);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
			return redirect(302, "/admin");
		} else {
			const account = await db.query.accounts.findFirst({
				where: () =>
					and(eq(tables.accounts.login, form.data.userId), eq(tables.accounts.role, "student")),
				with: { student: true },
			});
			// TODO: display these messages
			if (!account) {
				return fail(400, { message: "Incorrect username or password" });
			}
			const validPassword = await new Argon2id().verify(account.passwordHash, password);
			if (!validPassword) {
				return fail(400, { message: "Incorrect username or password" });
			}
			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, account.id);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

			return redirect(302, "/dashboard");
		}
	},
};
