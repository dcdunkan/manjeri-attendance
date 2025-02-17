import { getPeriod } from "$lib/server/db/periods";
import { notOk, ok } from "$lib/responses";
import type { Data } from "$lib/types";

const paramkeys = {
	subjectId: "subject",
	periodId: "period",
};

export async function GET({ request }) {
	const { searchParams } = new URL(request.url);

	if (!searchParams.has(paramkeys.subjectId)) return notOk("Subject ID is required", 400);
	if (!searchParams.has(paramkeys.periodId)) return notOk("Period ID is required", 400);

	const subjectId = Number(searchParams.get(paramkeys.subjectId));
	if (isNaN(subjectId)) return notOk("Subject ID is invalid", 400);

	const periodId = Number(searchParams.get(paramkeys.periodId));
	if (isNaN(periodId)) return notOk("Period ID is invalid", 400);

	try {
		const period = await getPeriod(subjectId, periodId);
		if (period == null) return notOk("Period data not found", 400);
		return ok<Data.Period.Get>(period);
	} catch (error) {
		console.error(error);
		return notOk("Internal Server Error.", 501);
	}
}
