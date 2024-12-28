import { env } from "$env/dynamic/private";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schemas from "./schema";

const connectionString = env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const sql = neon(connectionString);
export const db = drizzle({ client: sql, casing: "snake_case", schema: schemas });
