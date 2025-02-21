import { notOk, ok } from "$lib/responses";
import { db } from "$lib/server/db/index";
import * as schema from "$lib/server/db/schema";
import { and } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
	subjectId: z.coerce.number().positive(),
	batchId: z.coerce.number().positive(),
	name: z
		.string({
			invalid_type_error: "Invalid name input",
			required_error: "A name is required",
		})
		.min(3, "Name is too short")
		.max(128, "Name is too long"),
});

export async function PATCH({ request, locals }) {
	if (locals.account == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "administrator") return notOk("Forbidden", 401);

	if (request.headers.get("content-type") !== "application/json")
		return notOk("Invalid content type", 400);

	let data: z.infer<typeof patchSchema>;
	try {
		const json = await request.json();
		const parsed = patchSchema.safeParse(json);
		if (!parsed.success) return notOk(parsed.error.message, 400);
		data = parsed.data;
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	try {
		await db
			.update(schema.subjects)
			.set({ name: data.name })
			.where(
				and(eq(schema.subjects.batchId, data.batchId), eq(schema.subjects.id, data.subjectId)),
			);
		return ok({ message: "Successfully update the subject name" });
	} catch (error) {
		console.error(error);
		return notOk("Couldn't update the subject name.", 500);
	}
}
