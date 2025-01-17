import { DATABASE_URL, ADMIN_LOGIN, ADMIN_PASSWORD } from "$env/static/private";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth";

const connectionString = DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const neonClient = neon(connectionString);
export const db = drizzle({ client: neonClient, casing: "snake_case", schema: schema });

// Setup the administrator account.
// TODO: refactor this shit.
(async () => {
	const results = await db.query.accounts.findMany({
		where: () => eq(schema.accounts.role, "administrator"),
	});
	if (results.length == 0) {
		console.log("Found no administrator account. Creating...");
		const hash = await hashPassword(ADMIN_PASSWORD);
		await db.insert(schema.accounts).values({
			login: ADMIN_LOGIN,
			passwordHash: hash,
			role: "administrator",
		});
	} else if (results.length > 1) {
		// shouldn't be happening, ONLY one.
		console.log("Found more than one administrator account. Deleting...");
		await db.delete(schema.accounts).where(eq(schema.accounts.role, "administrator"));
		const hash = await hashPassword(ADMIN_PASSWORD);
		await db.insert(schema.accounts).values({
			login: ADMIN_LOGIN,
			passwordHash: hash,
			role: "administrator",
		});
	} else if (results[0].login !== ADMIN_LOGIN) {
		console.log("Found administrator account that isn't matching. Fixing...");
		await db
			.update(schema.accounts)
			.set({ login: ADMIN_LOGIN })
			.where(eq(schema.accounts.id, results[0].id));
	}
	console.log("Setup administrator account successfully.");
})();
