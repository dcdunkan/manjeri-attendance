import { db } from "$lib/server/db";
import { and, eq, sql } from "drizzle-orm";
import * as schema from "./schema";

export async function getAccount(userId: string, role: schema.AccountRole) {
	return await db.query.accounts.findFirst({
		extras: {
			sessionCount: db
				.$count(schema.sessions, sql.raw(`"sessions"."account_id" = "accounts"."id"`))
				.mapWith(Number)
				.as("session_count"),
		},
		where: () => and(eq(schema.accounts.login, userId), eq(schema.accounts.role, role)),
	});
}
