import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getEnrolledSubjects } from "$lib/server/db/enrollments";

export const load: PageServerLoad = ({ locals }) => {
	if (locals.account?.role !== "student" || locals.account.student?.id == null) {
		return error(403, "Forbidden");
	}

	return {
		title: "Attendance",
		backwards: "/",
		studentId: locals.account.student.id,
		subjects: getEnrolledSubjects(locals.account.student.id),
	};
};
