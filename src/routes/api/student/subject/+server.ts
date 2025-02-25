import { notOk, ok } from "$lib/responses";
import { getAbsentPeriods } from "$lib/server/db/students";
import type { Data } from "$lib/types.js";
import { z } from "zod";

const getSchema = z.object({
	student: z.coerce.number(),
	subject: z.coerce.number(),
	// page: z.coerce.number().min(1),
});

export async function GET({ request, locals }) {
	if (locals.account == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "student" || locals.account.student == null)
		return notOk("Forbidden", 401);

	const { searchParams } = new URL(request.url);
	const parsed = getSchema.safeParse(Object.fromEntries(searchParams.entries()));
	if (!parsed.success) {
		return notOk(parsed.error.issues[0]?.message ?? "Invalid inputs!", 400);
	}
	const result = await getAbsentPeriods(parsed.data.student, parsed.data.subject);
	return ok<Data.SubjectAbsentPeriods>(result);
}
