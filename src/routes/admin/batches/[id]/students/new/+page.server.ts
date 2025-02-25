import { fail, setError, superValidate } from "sveltekit-superforms";
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

export const load: PageServerLoad = async (event) => {
	const batchId = Number(event.params.id);
	if (isNaN(batchId)) {
		return error(404, { message: "Not found" });
	}
	return {
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
			const queryCheck = await db.query.accounts.findFirst({
				where: and(
					eq(tables.accounts.login, form.data.loginId),
					eq(tables.accounts.role, "student"),
				),
			});
			if (queryCheck != null) {
				return setError(form, "loginId", "Student with the same login ID already exists.");
			}

			const passwordHash = await hashPassword(form.data.password);

			const [account] = await db
				.insert(tables.accounts)
				.values({
					login: form.data.loginId,
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
					isRep: false,
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
