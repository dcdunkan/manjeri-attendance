import { fail, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import type { PageServerLoad, Actions } from "./$types";
import { formSchema } from "./student-form.svelte";
import { error } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { getBatchWithSubjects } from "$lib/server/db/batches";
import * as tables from "$lib/server/db/schema";
import { redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "$lib/server/auth";
import { generateLoginId } from "$lib/helpers";

export const load: PageServerLoad = async (event) => {
	const batchId = Number(event.params.id);
	if (isNaN(batchId)) {
		return error(404, { message: "Not found" });
	}
	return {
		title: "Register Student",
		backwards: `/admin/batches/${batchId}/students`,
		result: Promise.all([superValidate(zod(formSchema)), getBatchWithSubjects(batchId)]),
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(formSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const batchId = Number(event.params.id);
		if (isNaN(batchId)) {
			return error(404, { message: "Batch ID is invalid" });
		}

		let studentId: number;

		try {
			const batch = await db.query.batches.findFirst({
				columns: { name: true },
				where: () => eq(tables.batches.id, batchId),
			});

			if (batch == null) {
				return error(404, { message: "Couldn't find the corresponding batch." });
			}

			const loginId = generateLoginId(form.data.rollNumber, batch.name);
			if (loginId == null) {
				return error(404, { message: "Couldn't generate a valid login ID" });
			}

			const queryCheck = await db.query.accounts.findFirst({
				where: and(eq(tables.accounts.login, loginId), eq(tables.accounts.role, "student")),
			});
			if (queryCheck != null) {
				return error(404, { message: "Student with the same login ID already exists." });
			}

			const passwordHash = await hashPassword(form.data.password);

			const [account] = await db
				.insert(tables.accounts)
				.values({
					login: loginId,
					role: "student",
					passwordHash: passwordHash,
				})
				.returning({ id: tables.accounts.id });

			const [student] = await db
				.insert(tables.students)
				.values({
					id: account.id,
					batchId: batchId,
					fullName: form.data.name,
					rollNumber: form.data.rollNumber,
				})
				.returning({ id: tables.students.id });

			await db.insert(tables.enrollments).values(
				form.data.enrolledSubjects.map((subjectId) => {
					return {
						studentId: student.id,
						subjectId: subjectId,
					};
				}),
			);

			studentId = account.id;
		} catch (err) {
			console.error(err);
			return error(500, "Something went wrong!");
		}

		redirect(303, `/admin/batches/${batchId}/students/${studentId}`);
	},
};
