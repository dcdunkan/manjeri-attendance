import { notOk, ok } from "$lib/responses";
import { hashPassword, verifyHash } from "$lib/server/auth.js";
import { db } from "$lib/server/db/index";
import * as schema from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const basePasswdStrSchema = z.string().min(6, "Too weak").max(128, "Too strong");
const patchSchema = z.object({
	currentPassword: basePasswdStrSchema,
	newPassword: basePasswdStrSchema,
});

export async function PATCH({ request, locals }) {
	if (locals.account == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "student" || locals.account.student == null)
		return notOk("Forbidden", 401);

	if (request.headers.get("content-type") !== "application/json")
		return notOk("Invalid content type", 400);

	let data: z.infer<typeof patchSchema>;
	try {
		const json = await request.json();
		const parsed = patchSchema.safeParse(json);
		// TODO: fix this! parsed.error.message ain't real string.
		if (!parsed.success) return notOk(parsed.error.message, 400);
		data = parsed.data;
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	try {
		const accountId = locals.account.id;
		const [account] = await db
			.select({ passwordHash: schema.accounts.passwordHash })
			.from(schema.accounts)
			.where(eq(schema.accounts.id, accountId));
		if (account == null) throw new Error("Account not found");

		const isCurrentPasswordCorrect = await verifyHash(account.passwordHash, data.currentPassword);
		if (!isCurrentPasswordCorrect) return notOk("Wrong current password!", 400);

		const isSame = await verifyHash(account.passwordHash, data.newPassword);
		if (isSame) return notOk("Current password and new password can't be same", 400);

		const hashedPassword = await hashPassword(data.newPassword);
		await db
			.update(schema.accounts)
			.set({ passwordHash: hashedPassword })
			.where(eq(schema.accounts.id, accountId));
		return ok(true);
	} catch (error) {
		console.error(error);
		return notOk("Internal Server Error.", 501);
	}
}
