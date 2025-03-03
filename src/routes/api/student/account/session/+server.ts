import { SESSION_MODIFY_RESTRICTION_PERIOD } from "$lib/constants.js";
import { timeDistance } from "$lib/helpers.js";
import { notOk, ok } from "$lib/responses";
import { db } from "$lib/server/db/index";
import * as schema from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const deleteSchema = z.object({
	sessionId: z.string().nonempty(),
});

export async function DELETE({ request, locals }) {
	if (locals.account == null || locals.session == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "student" || locals.account.student == null)
		return notOk("Forbidden", 401);

	const { searchParams } = new URL(request.url);
	const parsed = deleteSchema.safeParse(Object.fromEntries(searchParams));
	if (!parsed.success) {
		return notOk(parsed.error.issues[0]?.message ?? "Invalid inputs!", 400);
	}

	const currentSession = await db.query.sessions.findFirst({
		columns: { createdAt: true, expiresAt: true },
		where: eq(schema.sessions.id, locals.session.id),
	});
	if (currentSession == null) {
		return notOk("Invalid session.", 401);
	}

	const now = Date.now();
	const timeSinceSessionCreated = now - currentSession.createdAt.getTime();
	if (timeSinceSessionCreated <= SESSION_MODIFY_RESTRICTION_PERIOD) {
		return notOk(`Please wait ${timeDistance(now, currentSession.createdAt.getTime())}`, 400);
	}

	try {
		await db.delete(schema.sessions).where(eq(schema.sessions.id, parsed.data.sessionId));
		return ok<boolean>(true);
	} catch (error) {
		console.error(error);
		return notOk("Failed to logout the session.", 501);
	}
}
