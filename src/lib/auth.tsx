import { betterAuth } from "better-auth";
import { reactStartCookies } from "better-auth/react-start";
import { emailOTP, organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import { sendEmail } from "@/server/lib/email";
import { members } from "@/server/db/auth";
import { eq } from "drizzle-orm";

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
	plugins: [
		emailOTP({
			async sendVerificationOTP({ email, otp }) {
				await sendEmail({
					to: [email],
					subject: "One-time password for Kokobi",
					content: (
						<div>
							<p>
								Here is your one-time password to verify your
								email address.
							</p>
							<strong>{otp}</strong>
						</div>
					),
				});
			},
		}),
		organization({
			cancelPendingInvitationsOnReInvite: true,
		}),
		reactStartCookies(),
	],
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
