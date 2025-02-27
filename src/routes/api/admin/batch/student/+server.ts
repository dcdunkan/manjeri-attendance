import { generateLoginId } from "$lib/helpers.js";
import { notOk, ok } from "$lib/responses";
import { db } from "$lib/server/db/index";
import * as schema from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
	batchId: z.number(),
	studentId: z.number(),
	fullName: z
		.string({
			invalid_type_error: "Invalid name input",
			required_error: "A name is required",
		})
		.trim()
		.nonempty("A name is required")
		.min(3, "Name is too short")
		.max(32, "Name is too long"),
	rollNumber: z
		.number({
			invalid_type_error: "Roll number",
			required_error: "Roll number is required",
		})
		.min(1, "Must be a natural number.")
		.finite(),
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
		if (!parsed.success) {
			return notOk(parsed.error.issues[0]?.message ?? "Invalid inputs!", 400);
		}
		data = parsed.data;
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	try {
		const student = await db.query.students.findFirst({
			columns: {},
			with: {
				account: { columns: { id: true } },
				batch: { columns: { name: true } },
			},
			where: () => eq(schema.students.id, data.studentId),
		});

		if (student == null) {
			return notOk("Student doesn't exist", 400);
		}

		const rollNumberQuery = await db.query.students.findFirst({
			columns: { id: true },
			where: () =>
				and(
					eq(schema.students.batchId, data.batchId),
					eq(schema.students.rollNumber, data.rollNumber),
				),
		});
		if (rollNumberQuery != null && rollNumberQuery.id !== data.studentId) {
			return notOk("Roll number already exists in batch", 400);
		}

		const newLoginId = generateLoginId(data.rollNumber, student.batch.name);
		if (newLoginId == null) {
			return notOk("Couldn't generate a new login ID", 400);
		}

		await db
			.update(schema.students)
			.set({ fullName: data.fullName, rollNumber: data.rollNumber })
			.where(eq(schema.students.id, data.studentId));

		await db
			.update(schema.accounts)
			.set({ login: newLoginId })
			.where(eq(schema.accounts.id, student.account.id));

		return ok({ login: newLoginId });
	} catch (error) {
		console.error(error);
		return notOk("Couldn't update the subject name.", 500);
	}
}

const deleteSchema = z.object({
	studentId: z.coerce.number(),
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
		const student = await db.query.students.findFirst({
			columns: {},
			with: { account: { columns: { id: true } } },
			where: eq(schema.students.id, data.studentId),
		});
		if (student == null) {
			return notOk("Couldn't find the student.", 400);
		}

		await db.delete(schema.accounts).where(eq(schema.accounts.id, student.account.id));
		// Deleting the account should also delete the student, but still to be sure:
		await db.delete(schema.students).where(eq(schema.students.id, data.studentId));
		return ok(true);
	} catch (error) {
		console.error(error);
		return notOk("Couldn't delist the student.", 500);
	}
}
