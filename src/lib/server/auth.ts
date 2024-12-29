import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import * as tables from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { eq } from "drizzle-orm";
import type { RequestEvent } from "@sveltejs/kit";

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const EXPIRATION_PERIOD = 30 * DAY_IN_MS;
const RENEW_PERIOD = 15 * DAY_IN_MS;

export const sessionCookieName = "auth-session";

export function generateSessionToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(token: string, accountId: number): Promise<tables.Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: tables.Session = {
		id: sessionId,
		accountId,
		expiresAt: new Date(Date.now() + EXPIRATION_PERIOD),
	};
	await db.insert(tables.sessions).values(session);
	return session;
}

export type AccountRedacted = Omit<tables.Account, "passwordHash">;

export async function validateSessionToken(token: string): Promise<{
	session: tables.Session | null;
	account: (AccountRedacted & { student: tables.Student }) | null;
}> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const result = await db.query.sessions.findFirst({
		where: (sessions) => eq(sessions.id, sessionId),
		with: {
			account: {
				columns: { passwordHash: false },
				with: { student: true },
			},
		},
	});

	if (result == null) {
		return { session: null, account: null };
	}

	const { account, ...session } = result;

	const sessionExpired = Date.now() >= result.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(tables.sessions).where(eq(tables.sessions.id, result.id));
		return { session: null, account: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - RENEW_PERIOD;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + EXPIRATION_PERIOD);
		await db
			.update(tables.sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(tables.sessions.id, session.id));
	}

	return { session: result, account };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(tables.sessions).where(eq(tables.sessions.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, { expires: expiresAt, path: "/" });
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, { path: "/" });
}
