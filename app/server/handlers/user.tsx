import {
	authMiddleware,
	localeMiddleware,
	protectedMiddleware,
} from "../middleware";
import { db } from "@/server/db";
import { teams, users, usersToTeams } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { createI18n } from "@/lib/locale/actions";
import { handleLocalization } from "@/lib/locale/helpers";
import { z } from "zod";
import { LocaleSchema } from "@/lib/locale";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { createSession, invalidateSession } from "@/server/auth";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { Team, TeamTranslation } from "@/types/team";

import { emailVerifications } from "@/server/db/schema";
import { sendEmail, verifyEmail } from "@/server/email";
import { getTenant } from "@/server/helpers";
import { generateRandomString } from "@/server/random";
import { env } from "../env";

export const updateI18nFn = createServerFn({ method: "POST" })
	.validator(z.object({ locale: LocaleSchema }))
	.handler(async ({ data: { locale } }) => {
		setCookie("locale", locale);
		return { locale };
	});

export const getI18nFn = createServerFn({ method: "GET" })
	.middleware([localeMiddleware])
	.handler(async ({ context }) => {
		const locale = context.locale;
		const i18n = await createI18n({ locale });
		return i18n;
	});

export const getAuthFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		return context;
	});

export const getTeamsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["learner", "admin"]),
		}),
	)
	.handler(async ({ context, data: { type } }) => {
		const user = context.user;

		if (!user) {
			throw new Error("Unauthorized");
		}

		if (type === "learner") {
			let learnerTeam = undefined;
			if (context.learnerTeamId) {
				learnerTeam = await db.query.teams.findFirst({
					where: eq(teams.id, context.learnerTeamId),
					with: {
						translations: true,
					},
				});
			}
			const welcomeTeam = await db.query.teams.findFirst({
				where: eq(teams.id, env.WELCOME_TEAM_ID),
				with: {
					translations: true,
				},
			});
			const courseTeams = await db.query.usersToCourses.findMany({
				where: eq(usersToTeams.userId, user.id),
				with: {
					team: {
						with: {
							translations: true,
						},
					},
				},
			});
			const collectionTeams = await db.query.usersToCollections.findMany({
				where: eq(usersToTeams.userId, user.id),
				with: {
					team: {
						with: {
							translations: true,
						},
					},
				},
			});

			return [
				...(learnerTeam ? [learnerTeam] : []),
				...(welcomeTeam ? [welcomeTeam] : []),
				...collectionTeams.map(({ team }) => team),
				...courseTeams.map(({ team }) => team),
			]
				.map((team) => handleLocalization(context, team))
				.reduce(
					(acc, team) =>
						acc.find((t) => t.id === team.teamId)
							? acc
							: [...acc, team],
					[] as (Team & TeamTranslation)[],
				);
		}

		if (type === "admin") {
			const teams = await db.query.usersToTeams.findMany({
				where: eq(usersToTeams.userId, user.id),
				with: {
					team: {
						with: {
							translations: true,
						},
					},
				},
			});

			return teams.map(({ team }) => handleLocalization(context, team));
		}

		return [];
	});

export const setTeamFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(
		z.object({
			teamId: z.string(),
			type: z.enum(["learner", "admin"]),
		}),
	)
	.handler(async ({ context, data }) => {
		if (data.type === "learner" && context.learnerTeamId !== data.teamId) {
			setCookie("learnerTeamId", data.teamId);
		}
		if (data.type === "admin" && data.teamId !== context.teamId) {
			const team = await db.query.usersToTeams.findFirst({
				where: and(
					eq(usersToTeams.userId, context.user.id),
					eq(usersToTeams.teamId, data.teamId),
				),
			});

			if (!team) {
				throw new Error("You are not a member of this team");
			}

			setCookie("teamId", data.teamId);
		}
	});

export const signOutFn = createServerFn()
	.middleware([authMiddleware, localeMiddleware])
	.handler(async ({ context }) => {
		if (!context.user || !context.session) return;
		deleteCookie("auth_session");
		deleteCookie("teamId");
		deleteCookie("learnerTeamId");
		invalidateSession(context.session.id);
		throw redirect({
			to: "/$locale/auth/login",
			params: { locale: context.locale },
		});
	});

export const UserFormSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
});
export type UserFormType = z.infer<typeof UserFormSchema>;
export const updateUserFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(UserFormSchema)
	.handler(async ({ context, data }) => {
		await db.update(users).set(data).where(eq(users.id, context.user.id));
	});

export const LoginFormSchema = z.object({
	email: z.string().email(),
});
export type LoginFormType = z.infer<typeof LoginFormSchema>;
export const requestOTPFn = createServerFn({ method: "POST" })
	.middleware([localeMiddleware])
	.validator(LoginFormSchema)
	.handler(async ({ data, context }) => {
		// Create or query user
		const [user] = await db
			.insert(users)
			.values({
				id: Bun.randomUUIDv7(),
				email: data.email,
			})
			.onConflictDoUpdate({
				target: [users.email],
				set: {
					updatedAt: new Date(),
				},
			})
			.returning();

		await db
			.delete(emailVerifications)
			.where(eq(emailVerifications.userId, user.id));

		// Create email verification record
		const [emailVerification] = await db
			.insert(emailVerifications)
			.values({
				id: Bun.randomUUIDv7(),
				userId: user.id,
				// 6 characters, no 0,O,I,1 to avoid confusion
				code: generateRandomString(
					6,
					"ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
				),
				// 10 minutes
				expiresAt: new Date(Date.now() + 1000 * 60 * 10),
			})
			.returning();

		// If on a tenant, get the team, and send email from the tenant
		let team = undefined;
		const tenantId = await getTenant();
		if (tenantId) {
			const teamBase = await db.query.teams.findFirst({
				where: eq(teams.id, tenantId),
				with: {
					translations: true,
					domains: true,
				},
			});
			if (teamBase) {
				team = handleLocalization(context, teamBase);
			}
		}

		const emailVerified = team && (await verifyEmail(team.domains));

		// Send verification email
		await sendEmail({
			to: [data.email],
			subject: "Email Verification Code",
			team: emailVerified ? team : undefined,
			content: (
				<div>
					Here is your verification code:{" "}
					<b>{emailVerification.code}</b>
				</div>
			),
		});

		// Set email verification cookie
		setCookie("email_verification", emailVerification.id, {
			httpOnly: true,
			path: "/",
			secure: process.env.STAGE === "production",
			sameSite: "lax",
			expires: emailVerification.expiresAt,
		});
	});

export const OTPFormSchema = z.object({
	code: z.string().min(6).max(6),
});
export type OTPFormType = z.infer<typeof OTPFormSchema>;
export const verifyOTPFn = createServerFn({ method: "POST" })
	.middleware([localeMiddleware])
	.validator(OTPFormSchema)
	.handler(async ({ data }) => {
		const verificationCookie = getCookie("email_verification");
		if (!verificationCookie)
			throw new Error("Invalid verification session. Please try again.");

		const emailVerification = await db.query.emailVerifications.findFirst({
			where: and(
				eq(emailVerifications.id, verificationCookie),
				eq(emailVerifications.code, data.code),
			),
			with: {
				user: true,
			},
		});
		if (!emailVerification)
			throw new Error("Invalid code. Please try again.");
		if (emailVerification.expiresAt < new Date()) {
			throw new Error("The verification code was expired.");
		}

		const token = Bun.randomUUIDv7();
		await createSession(token, emailVerification.user.id);

		setCookie("auth_session", token, {
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			sameSite: "lax",
			path: "/",
		});

		const team = await db.query.usersToTeams.findFirst({
			where: eq(usersToTeams.userId, emailVerification.user.id),
		});

		if (team) {
			setCookie("teamId", team.teamId, {
				path: "/",
				secure: true,
				httpOnly: true,
				sameSite: "lax",
			});
		}

		await db
			.delete(emailVerifications)
			.where(eq(emailVerifications.userId, emailVerification.userId));
	});
