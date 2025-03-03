import { getStudent, isUnsafePasswordSaved } from "$lib/server/db/students";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
	if (!event.locals.account || event.locals.account.role !== "student") {
		return redirect(303, "/logout");
	}

	const { batchId, id } = event.locals.account.student;

	async function filteredStudentDetails() {
		const student = await getStudent(batchId, id);
		if (student == null) throw new Error("Failed to get student details.");

		return {
			subjects: Object.fromEntries(
				student.enrollments.map((enroll) => {
					return [enroll.subject.id, enroll.subject];
				}),
			),
			representations: student.representations,
			attendance: student.enrollments.reduce(
				(overview, { subject }) => ({
					total: overview.total + subject.periodCount,
					attended: overview.attended + (subject.periodCount - subject.asbentCount),
				}),
				{ total: 0, attended: 0 },
			),
		};
	}

	return {
		title: "Dashboard",
		showTitle: false,
		local: event.locals.account.student,
		details: filteredStudentDetails(),
		isDefaultPassword: isUnsafePasswordSaved(event.locals.account.id),
	};
};
