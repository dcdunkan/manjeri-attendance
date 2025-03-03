import { db } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export async function getSessions(accountId: number) {
	return await db.query.sessions.findMany({
		columns: { accountId: false },
		where: eq(schema.sessions.accountId, accountId),
	});
}
