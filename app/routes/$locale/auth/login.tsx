import { FloatingPage, PageHeader } from "@/components/Page";
import { useAppForm } from "@/components/ui/form";
import { db } from "@/server/db";
import { emailVerifications, teams, users } from "@/server/db/schema";
import { sendEmail, verifyEmail } from "@/server/email";
import { getTeamByIdFn, getTenantFn } from "@/server/handlers/teams";
import { getAuthFn } from "@/server/handlers/user";
import { localeMiddleware } from "@/server/middleware";
import { generateRandomString } from "@/server/random";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { setCookie } from "vinxi/http";
import { z } from "zod";
import { handleLocalization } from "@/lib/locale/helpers";
import { TeamIcon } from "@/components/TeamIcon";
import { teamImageUrl } from "@/lib/file";
import { Team, TeamTranslation } from "@/types/team";

export const RedirectSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/$locale/auth/login")({
	component: RouteComponent,
	validateSearch: RedirectSchema,
	beforeLoad: async ({ params }) => {
		const auth = await getAuthFn();
		if (auth.session) throw redirect({ to: "/$locale/admin", params });
	},
	loader: async () => {
		const tenantId = await getTenantFn();
		let team: (Team & TeamTranslation) | undefined = undefined;
		if (tenantId) {
			const tenant = await getTeamByIdFn({
				data: {
					teamId: tenantId,
				},
			});
			team = tenant;
		}
		return {
			team,
		};
	},
});

const LoginFormSchema = z.object({
	email: z.string().email(),
});
type LoginFormType = z.infer<typeof LoginFormSchema>;

const LoginForm = ({
	onSubmit,
	defaultValues,
}: {
	onSubmit: (data: LoginFormType) => Promise<any>;
	defaultValues?: LoginFormType;
}) => {
	const form = useAppForm({
		defaultValues: {
			...defaultValues,
			email: "",
		} as LoginFormType,
		validators: {
			onSubmit: LoginFormSchema,
		},
		onSubmit: ({ value }) => onSubmit(value),
	});
	return (
		<form.AppForm>
			<form
				className="flex flex-col gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<form.AppField
					name="email"
					children={(field) => <field.TextField label="Email" />}
				/>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};

const requestOTPFn = createServerFn({ method: "POST" })
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
		const tenantId = await getTenantFn();
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

function RouteComponent() {
	const navigate = Route.useNavigate();
	const requestMutation = useMutation({
		mutationFn: requestOTPFn,
		onSuccess: () => {
			navigate({
				to: "/$locale/auth/verify-email",
				params: (p) => p,
				search: (s) => s,
			});
		},
	});
	const { team } = Route.useLoaderData();

	return (
		<FloatingPage>
			<div className="max-w-md w-full flex flex-col">
				{team && (
					<TeamIcon
						src={teamImageUrl(team, "logo")}
						className="mb-8"
					/>
				)}
				<PageHeader
					title="Login"
					description="Enter your email below and submit to login"
				/>
				<LoginForm
					onSubmit={(data) => requestMutation.mutateAsync({ data })}
				/>
			</div>
		</FloatingPage>
	);
}
