import { getPeriods } from "$lib/server/db/periods";
import { notOk, ok } from "$lib/responses";
import type { Data } from "$lib/types";
import { isValidDate } from "$lib/helpers.js";

const paramkeys = {
	subjectId: "subject",
	startTime: "start",
	endTime: "end",
};

export async function GET({ request }) {
	const { searchParams } = new URL(request.url);

	if (!searchParams.has(paramkeys.subjectId)) return notOk("Subject ID is required", 400);
	if (!searchParams.has(paramkeys.startTime)) return notOk("Start time is required", 400);
	if (!searchParams.has(paramkeys.endTime)) return notOk("End time is required", 400);

	const subjectId = Number(searchParams.get(paramkeys.subjectId));
	if (isNaN(subjectId)) return notOk("Subject ID is invalid", 400);

	const startTime = new Date(Number(searchParams.get(paramkeys.startTime)));
	if (!isValidDate(startTime)) return notOk("Start time is invalid", 400);

	const endTime = new Date(Number(searchParams.get(paramkeys.endTime)));
	if (!isValidDate(endTime)) return notOk("End time is invalid", 400);

	try {
		const periods = await getPeriods(subjectId, startTime, endTime);
		return ok<Data.Periods.GetAll>(periods);
	} catch (error) {
		console.error(error);
		return notOk("Internal Server Error.", 501);
	}
}
