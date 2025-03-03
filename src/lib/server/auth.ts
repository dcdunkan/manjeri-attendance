import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import * as tables from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { eq } from "drizzle-orm";
import type { RequestEvent } from "@sveltejs/kit";
import { Argon2id } from "oslo/password";
import { getDeviceInfo, type DeviceInfo } from "$lib/device-info";
import {
	SESSION_EXPIRATION_PERIOD,
	SESSION_RENEW_PERIOD,
	SESSION_LAST_ACTIVE_UPDATE_FREEZE_PERIOD,
} from "$lib/constants";

const argon = new Argon2id();

export function hashPassword(password: string) {
	return argon.hash(password);
}

export function verifyHash(hash: string, password: string) {
	return argon.verify(hash, password);
}

export const sessionCookieName = "auth-session";

export function generateSessionToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(
	token: string,
	accountId: number,
	deviceInfo: DeviceInfo,
): Promise<tables.Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const now = new Date();
	const session: tables.Session = {
		id: sessionId,
		accountId,
		expiresAt: new Date(now.getTime() + SESSION_EXPIRATION_PERIOD),
		deviceInfo: deviceInfo.label,
		deviceType: deviceInfo.type,
		createdAt: now,
		lastActive: now,
	};
	await db.insert(tables.sessions).values(session);
	return session;
}

export type AccountRedacted = Omit<tables.Account, "passwordHash">;

export async function validateSessionToken(
	token: string,
	userAgent: string | null,
): Promise<{
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

	const now = new Date();
	const sessionExpired = now.getTime() >= result.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(tables.sessions).where(eq(tables.sessions.id, result.id));
		return { session: null, account: null };
	}

	const deviceInfo = getDeviceInfo(userAgent);
	const renewSession = now.getTime() >= session.expiresAt.getTime() - SESSION_RENEW_PERIOD;
	const sinceLastActive = now.getTime() - session.lastActive.getTime();

	const alwaysIncluded: Partial<tables.Session> = {
		deviceType: deviceInfo.type,
		deviceInfo: deviceInfo.label,
		lastActive: now,
	};
	if (renewSession) {
		session.expiresAt = new Date(now.getTime() + SESSION_EXPIRATION_PERIOD);
		await db
			.update(tables.sessions)
			.set({ expiresAt: session.expiresAt, ...alwaysIncluded })
			.where(eq(tables.sessions.id, session.id));
	} else if (
		sinceLastActive > SESSION_LAST_ACTIVE_UPDATE_FREEZE_PERIOD ||
		deviceInfo.label !== session.deviceInfo ||
		deviceInfo.type !== session.deviceType
	) {
		console.log("writing last active for", deviceInfo);
		await db
			.update(tables.sessions)
			.set({ ...alwaysIncluded })
			.where(eq(tables.sessions.id, session.id));
	}

	return { session, account };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(tables.sessions).where(eq(tables.sessions.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: "/",
		secure: import.meta.env.PROD,
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, { path: "/", secure: import.meta.env.PROD });
}
