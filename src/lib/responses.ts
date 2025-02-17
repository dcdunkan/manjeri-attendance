import { json } from "@sveltejs/kit";

export function ok<T>(data?: T, status: number = 200) {
	return json({ ok: true, ...(data == null ? {} : { data }) }, { status });
}

export function notOk(reason: string, status: number) {
	return json({ ok: false, reason }, { status });
}
