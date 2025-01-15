import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { formSchema } from "./login-form.svelte";
import { zod } from "sveltekit-superforms/adapters";
import { fail, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { and, eq } from "drizzle-orm";
import * as tables from "$lib/server/db/schema";
import { ADMIN_LOGIN } from "$env/static/private";
import {
	createSession,
	verifyHash,
	generateSessionToken,
	setSessionTokenCookie,
} from "$lib/server/auth";
import { routes } from "$lib/utils";

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

		const role: tables.AccountRole = form.data.userId === ADMIN_LOGIN ? "administrator" : "student";

		const account = await db.query.accounts.findFirst({
			where: () => and(eq(tables.accounts.login, form.data.userId), eq(tables.accounts.role, role)),
		});

		// TODO: display these messages
		if (account == null) return fail(400, { message: "Incorrect username or password" });
		const validPassword = await verifyHash(account.passwordHash, form.data.password);
		if (!validPassword) return fail(400, { message: "Incorrect username or password" });

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, account.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return redirect(302, role === "administrator" ? routes.administrator : routes.dashboard);
	},
};
