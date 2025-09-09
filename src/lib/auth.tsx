import { betterAuth } from "better-auth";
import { reactStartCookies } from "better-auth/react-start";
import {
	apiKey,
	createAuthMiddleware,
	emailOTP,
	organization,
} from "better-auth/plugins";
import { setSessionCookie } from "better-auth/cookies";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import { members } from "@/server/db/auth";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { sendVerificationOTP } from "@/server/lib/email";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		usePlural: true,
	}),
	session: {
		additionalFields: {
			activeLearnerOrganizationId: {
				type: "string",
				optional: true,
			},
		},
	},
	trustedOrigins: ["*"],
	plugins: [
		emailOTP({
			sendVerificationOTP,
		}),
		admin(),
		apiKey({
			enableMetadata: true,
			// 60 requests per minute
			rateLimit: {
				timeWindow: 1000 * 60, // 1 minute
				maxRequests: 60,
			},
		}),
		organization({
			cancelPendingInvitationsOnReInvite: true,
		}),
		reactStartCookies(),
	],
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path == "/sign-in/email-otp") {
				const session = ctx.context.newSession;
				const dontRememberMe = !ctx.body.rememberMe;

				if (session && dontRememberMe) {
					// Sets the session and dont_remember cookies
					await setSessionCookie(ctx, session, dontRememberMe);

					// Updates the session expiry to 1 day (matches default remember me config)
					await ctx.context.internalAdapter.updateSession(
						session.session.token,
						{
							expiresAt: new Date(
								Date.now() + 24 * 60 * 60 * 1000,
							),
						},
					);
				}
			}
		}),
	},
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const firstMember = await db.query.members.findFirst({
						where: eq(members.userId, session.userId),
					});
					return {
						data: {
							...session,
							activeOrganizationId: firstMember?.organizationId,
						},
					};
				},
			},
		},
	},
});

export type Session = typeof auth.$Infer.Session;
