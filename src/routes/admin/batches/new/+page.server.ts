import { setError, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import type { PageServerLoad, Actions } from "./$types";
import { formSchema } from "./batch-form.svelte";
import { error, fail, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import * as tables from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod(formSchema)),
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(formSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		let batchId: number;
		const { name: batchName, subjects } = form.data;
		try {
			const query = await db.query.batches.findFirst({ where: eq(tables.batches.name, batchName) });
			if (query != null) {
				return setError(form, "name", "Batch with the same year already exists.");
			}

			const [batch] = await db.insert(tables.batches).values({ name: batchName }).returning();
			await db
				.insert(tables.subjects)
				.values(subjects.map((subject) => ({ name: subject, batchId: batch.id })));
			batchId = batch.id;
			// Can't redirect here, since it `throw`s.
		} catch (err) {
			console.error(err);
			return error(500, "Something went wrong!");
		}

		return redirect(303, `/admin/batches/${batchId}`);
	},
};
