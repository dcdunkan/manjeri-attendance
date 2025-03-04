import { notOk, ok } from "$lib/responses";
import { db } from "$lib/server/db/index";
import * as schema from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
	batchId: z.coerce.number().positive(),
	name: z
		.string({
			invalid_type_error: "Invalid name input",
			required_error: "A name is required",
		})
		.trim()
		.nonempty("A name is required")
		.min(3, "Name is too short")
		.max(32, "Name is too long"),
});

export async function PATCH({ request, locals }) {
	if (locals.account == null || locals.session == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "administrator") return notOk("Forbidden", 401);

	if (request.headers.get("content-type") !== "application/json")
		return notOk("Invalid content type", 400);

	let data: z.infer<typeof patchSchema>;
	try {
		const json = await request.json();
		const parsed = patchSchema.safeParse(json);
		if (!parsed.success) {
			return notOk(parsed.error.issues[0]?.message ?? "Invalid inputs!", 400);
		}
		data = parsed.data;
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	try {
		const batches = await db.query.batches.findMany({
			columns: { id: true, name: true },
			where: () => eq(schema.batches.id, data.batchId),
		});

		if (batches.every((batch) => batch.id !== data.batchId)) {
			return notOk("Batch not found", 400);
		}

		const loweredName = data.name.toLowerCase();
		if (batches.some((batch) => batch.name.toLowerCase() === loweredName)) {
			return notOk("New batch name can't be the same!", 400);
		}

		await db
			.update(schema.batches)
			.set({ name: data.name })
			.where(eq(schema.batches.id, data.batchId));
		return ok({ message: "Successfully changed the batch name" });
	} catch (error) {
		console.error(error);
		return notOk("Couldn't update the subject name.", 500);
	}
}
