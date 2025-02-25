// Based on: https://thecopenhagenbook.com
import { eq } from "drizzle-orm";
import { db } from "../db/db";
import { Session, sessions, User, users } from "../db/schema";

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };

const hash = (text: string): string => {
	const hash = new Bun.CryptoHasher("sha256");
	hash.update(text);
	return hash.digest("hex");
};

export async function createSession(
	token: string,
	userId: string,
): Promise<Session> {
	const sessionId = hash(token);
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
	};
	await db.insert(sessions).values(session);
	return session;
}

export async function validateSessionToken(
	token: string,
): Promise<SessionValidationResult> {
	const sessionId = hash(token);
	const result = await db
		.select({ user: users, session: sessions })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId));
	if (result.length < 1) {
		return { session: null, user: null };
	}
	const { user, session } = result[0];
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await db
			.update(sessions)
			.set({
				expiresAt: session.expiresAt,
			})
			.where(eq(sessions.id, session.id));
	}
	return { session, user };
}

export async function invalidateSession(token: string): Promise<void> {
	const sessionId = hash(token);
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}
