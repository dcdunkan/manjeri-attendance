import { notOk, ok } from "$lib/responses";
import { getMonthlyStudentPeriods } from "$lib/server/db/periods.js";
import type { Data } from "$lib/types.js";
import { z } from "zod";

const getSchema = z.object({
	start: z.coerce.number().pipe(z.coerce.date()),
	end: z.coerce.number().pipe(z.coerce.date()),
	subjects: z
		.string()
		.transform((s) => s.split(","))
		.pipe(z.array(z.coerce.number())),
});

export async function GET({ request, locals }) {
	if (locals.account == null || locals.session == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "student" || locals.account.student == null)
		return notOk("Forbidden", 401);

	const { searchParams } = new URL(request.url);
	const parsed = getSchema.safeParse(Object.fromEntries(searchParams.entries()));
	if (!parsed.success) {
		return notOk(parsed.error.issues[0]?.message ?? "Invalid inputs!", 400);
	}

	const result = await getMonthlyStudentPeriods(
		locals.account.student.id,
		parsed.data.start,
		parsed.data.end,
		parsed.data.subjects,
	);
	return ok<Data.MonthlyStudentPeriods>(result);
}
