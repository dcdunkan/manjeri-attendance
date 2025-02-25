import { DATABASE_URL, ADMIN_LOGIN, ADMIN_PASSWORD } from "$env/static/private";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { and, eq, not } from "drizzle-orm";
import { hashPassword, verifyHash } from "../auth";

const connectionString = DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const neonClient = neon(connectionString);
export const db = drizzle({ client: neonClient, casing: "snake_case", schema: schema });

// Setup the administrator account:
(async () => {
	console.log("Setting up administrator account...");
	const admins = await db.query.accounts.findMany({
		where: () => eq(schema.accounts.role, "administrator"),
	});

	const current = admins.find((admin) => admin.login === ADMIN_LOGIN);

	if (current == null) {
		console.log("Couldn't find current administrator account, setting one up");
		await db.delete(schema.accounts).where(eq(schema.accounts.role, "administrator"));
		const hash = await hashPassword(ADMIN_PASSWORD);
		await db.insert(schema.accounts).values({
			login: ADMIN_LOGIN,
			passwordHash: hash,
			role: "administrator",
		});
		console.log("Setup administrator account successfully.");
		return;
	}

	const isPasswordCorrect = await verifyHash(current.passwordHash, ADMIN_PASSWORD);
	if (!isPasswordCorrect) {
		console.log("Found administrator account, fixing the incorrect password");
		const hash = await hashPassword(ADMIN_PASSWORD);
		await db
			.update(schema.accounts)
			.set({ passwordHash: hash })
			.where(eq(schema.accounts.id, current.id));
	}

	if (admins.length > 1) {
		console.log("Found more than one administrator accounts, deleting the unncessary ones");
		await db.delete(schema.accounts).where(
			and(
				eq(schema.accounts.role, "administrator"),
				// Delete all the other administrator account instances
				not(eq(schema.accounts.id, current.id)),
			),
		);
	}

	console.log("Setup administrator account successfully.");
})();
