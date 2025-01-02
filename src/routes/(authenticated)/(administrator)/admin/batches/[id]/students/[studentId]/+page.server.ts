import { getStudent } from "$lib/server/db";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async (event) => {
	const batchId = Number(event.params.id),
		studentId = Number(event.params.studentId);

	if (isNaN(batchId) || isNaN(studentId)) {
		return error(404, { message: "Not found" });
	}

	return {
		student: Promise.resolve({
			id: 1001,
			fullName: "Sreerag P P",
			rollNumber: 1,
			isRep: false,
			account: { login: "2022001" },
			enrollments: [
				{
					id: 1,
					subject: { id: 13, name: "Medicine", periodCount: 0, asbentCount: 0 },
				},
				{
					id: 2,
					subject: { id: 14, name: "Microbiology", periodCount: 0, asbentCount: 0 },
				},
				{
					id: 3,
					subject: { id: 15, name: "Pathology", periodCount: 33, asbentCount: 2 },
				},
				{
					id: 4,
					subject: { id: 16, name: "Pharmacology", periodCount: 4, asbentCount: 0 },
				},
			],
			representations: [
				{
					subjectId: 16,
					id: 10,
					studentId: 1001,
				},
			],
			batch: { id: 10, name: "2022" },
		}) satisfies ReturnType<typeof getStudent>, // getStudent(batchId, studentId),
	};
};
