import { notOk, ok } from "$lib/responses";
import { db } from "$lib/server/db/index";
import * as schema from "$lib/server/db/schema";
import { z } from "zod";

const postSchema = z.object({
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

export async function POST({ request, locals }) {
	if (locals.account == null || locals.session == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "administrator") return notOk("Forbidden", 401);

	if (request.headers.get("content-type") !== "application/json")
		return notOk("Invalid content type", 400);

	let data: z.infer<typeof postSchema>;
	try {
		const json = await request.json();
		const parsed = postSchema.safeParse(json);
		if (!parsed.success) {
			return notOk(parsed.error.issues[0]?.message ?? "Invalid inputs!", 400);
		}
		data = parsed.data;
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	try {
		const [subject] = await db
			.insert(schema.subjects)
			.values({ batchId: data.batchId, name: data.name })
			.returning({ id: schema.subjects.id });
		return ok({ id: subject.id });
	} catch (error) {
		console.error(error);
		return notOk("Couldn't add the subject.", 500);
	}
}
