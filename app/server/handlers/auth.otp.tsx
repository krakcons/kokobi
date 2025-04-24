import { localeMiddleware } from "../lib/middleware";
import { db } from "@/server/db";
import { teams, users, usersToTeams } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale/helpers";
import { z } from "zod";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { createSession } from "@/server/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { emailVerifications } from "@/server/db/schema";
import { sendEmail, verifyEmail } from "@/server/lib/email";
import { getTenant } from "@/server/lib/tenant";
import { generateRandomString } from "@/server/lib/random";

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
