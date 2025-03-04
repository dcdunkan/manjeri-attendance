import { getPeriod } from "$lib/server/db/periods";
import { notOk, ok } from "$lib/responses";
import type { Data } from "$lib/types";
import { z } from "zod";

const getSchema = z.object({
	subject: z.coerce.number(),
	period: z.coerce.number(),
});

export async function GET({ request, locals }) {
	if (locals.account == null || locals.session == null) return notOk("Unauthorized", 401);
	if (locals.account.role !== "student" || locals.account.student == null)
		return notOk("Forbidden", 401);

	const { searchParams } = new URL(request.url);
	let data: z.infer<typeof getSchema>;
	try {
		const params = Object.fromEntries(searchParams.entries());
		const parsed = getSchema.safeParse(params);
		if (!parsed.success) {
			return notOk(parsed.error.issues[0]?.message ?? "Invalid inputs!", 400);
		}
		data = parsed.data;
	} catch (error) {
		console.error(error);
		return notOk("Failed to parse the body", 400);
	}

	try {
		const period = await getPeriod(data.subject, data.period);
		if (period == null) return notOk("Period data not found", 400);
		return ok<Data.Period.Get>(period);
	} catch (error) {
		console.error(error);
		return notOk("Internal Server Error.", 501);
	}
}
