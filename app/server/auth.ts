// Based on: https://thecopenhagenbook.com
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import {
	emailVerifications,
	Session,
	sessions,
	User,
	users,
	usersToTeams,
} from "./db/schema";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";
import { env } from "./env";
import { Role } from "@/types/users";
import { generateRandomString } from "./random";
import { sendEmail } from "./email";

export type AuthResult =
	| { session: Session; user: User; teamId: string | null; role: Role | null }
	| { session: null; user: null; teamId: null; role: null };

export const emptyAuth: AuthResult = {
	session: null,
	user: null,
	teamId: null,
	role: null,
};

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

export async function getAuth(token?: string): Promise<AuthResult> {
	if (!token) {
		return emptyAuth;
	}

	const sessionId = hash(token);

	const result = await db
		.select({ user: users, session: sessions })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId));

	if (result.length < 1) {
		return emptyAuth;
	}

	const { user, session } = result[0];

	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		return emptyAuth;
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

	// TEAM
	let teamId = getCookie("teamId") ?? null;
	let role: Role | null = null;

	if (user.id && teamId) {
		const team = await db.query.usersToTeams.findFirst({
			where: and(
				eq(usersToTeams.userId, user.id),
				eq(usersToTeams.teamId, teamId),
			),
		});

		if (!team) {
			deleteCookie("teamId");
			teamId = null;
		} else {
			role = team.role;
		}
	}

	return { session, user, teamId, role };
}

export async function invalidateSession(token: string): Promise<void> {
	const sessionId = hash(token);
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}
