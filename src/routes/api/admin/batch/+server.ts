import { notOk, ok } from "$lib/responses";
import { db } from "$lib/server/db";
import { z } from "zod";
import * as schema from "$lib/server/db/schema";
import { eq, inArray } from "drizzle-orm";

const deleteSchema = z.object({
	batchId: z.coerce.number(),
});

export async function DELETE({ request, locals }) {
	if (locals.account == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "administrator") return notOk("Forbidden", 401);

	const { searchParams } = new URL(request.url);

	let data: z.infer<typeof deleteSchema>;
	try {
		const json = Object.fromEntries(searchParams);
		const parsed = deleteSchema.safeParse(json);
		if (!parsed.success) {
			return notOk(parsed.error.issues[0]?.message ?? "Invalid inputs!", 400);
		}
		data = parsed.data;
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	try {
		const students = await db.query.students.findMany({
			where: () => eq(schema.students.batchId, data.batchId),
			columns: {},
			with: { account: { columns: { id: true } } },
		});
		if (students.length > 0) {
			const accounts = students.map((student) => student.account.id);
			await db.delete(schema.accounts).where(inArray(schema.accounts.id, accounts));
		}
		await db.delete(schema.batches).where(eq(schema.batches.id, data.batchId));
		return ok(true);
	} catch (error) {
		console.error(error);
		return notOk("Couldn't delete the batch.", 500);
	}
}
