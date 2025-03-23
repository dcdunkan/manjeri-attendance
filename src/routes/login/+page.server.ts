import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { formSchema } from "./login-form.svelte";
import { zod } from "sveltekit-superforms/adapters";
import { error, fail, redirect } from "@sveltejs/kit";
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
import { MAX_SESSIONS_PER_ACCOUNT, routes } from "$lib/constants";
import { getDeviceInfo } from "$lib/device-info";
import { getAccount } from "$lib/server/db/accounts";

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

		const account = await getAccount(form.data.userId, role);
		if (account == null) return error(404, { message: "Incorrect username or password." });
		const validPassword = await verifyHash(account.passwordHash, form.data.password);
		if (!validPassword) return error(400, { message: "Incorrect username or password" });

		// if (Number(account.sessionCount) >= MAX_SESSIONS_PER_ACCOUNT[role] - 1) {
		// 	await
		// }

		const sessionToken = generateSessionToken();
		const deviceInfo = getDeviceInfo(event.request.headers.get("User-Agent") ?? "");
		const session = await createSession(sessionToken, account.id, deviceInfo);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return redirect(302, role === "administrator" ? routes.administrator : routes.dashboard);
	},
};
