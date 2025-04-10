import { FloatingPage, PageHeader } from "@/components/Page";
import { useAppForm } from "@/components/ui/form";
import { db } from "@/server/db";
import { emailVerifications, users } from "@/server/db/schema";
import { sendEmail } from "@/server/email";
import { getAuthFn } from "@/server/handlers/user";
import { localeMiddleware } from "@/server/middleware";
import { generateRandomString } from "@/server/random";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { setCookie } from "vinxi/http";
import { z } from "zod";

export const Route = createFileRoute("/$locale/auth/login")({
	component: RouteComponent,
	beforeLoad: async ({ params }) => {
		const auth = await getAuthFn();
		if (auth.session) throw redirect({ to: "/$locale/admin", params });
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

		// Send verification email
		await sendEmail({
			to: [data.email],
			subject: "Email Verification Code",
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

		throw redirect({
			to: "/$locale/auth/verify-email",
			params: { locale: context.locale },
		});
	});

function RouteComponent() {
	const request = useServerFn(requestOTPFn);
	const requestMutation = useMutation({
		mutationFn: request,
	});

	return (
		<FloatingPage>
			<div className="max-w-md w-full">
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
