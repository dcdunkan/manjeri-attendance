import { drizzle } from "drizzle-orm/neon-http";
import { env } from "$env/dynamic/private";
import { neon } from "@neondatabase/serverless";

const connectionString = env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const sql = neon(connectionString);
export const db = drizzle({ client: sql, casing: "snake_case" });
