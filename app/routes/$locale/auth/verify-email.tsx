import { FloatingPage, PageHeader } from "@/components/Page";
import { useAppForm } from "@/components/ui/form";
import { createSession } from "@/server/auth";
import { db } from "@/server/db";
import { emailVerifications, usersToTeams } from "@/server/db/schema";
import { localeMiddleware } from "@/server/middleware";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { getCookie, setCookie } from "vinxi/http";
import { z } from "zod";
import { RedirectSchema } from "./login";

export const Route = createFileRoute("/$locale/auth/verify-email")({
	component: RouteComponent,
	validateSearch: RedirectSchema,
});

const OTPFormSchema = z.object({
	code: z.string().min(6).max(6),
});
type OTPFormType = z.infer<typeof OTPFormSchema>;

const OTPForm = ({
	onSubmit,
}: {
	onSubmit: (data: OTPFormType) => Promise<any>;
}) => {
	const form = useAppForm({
		defaultValues: {
			code: "",
		} as OTPFormType,
		validators: {
			onSubmit: OTPFormSchema,
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
					name="code"
					children={(field) => <field.TextField label="Code" />}
				/>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};

export const verifyOTPFn = createServerFn({ method: "POST" })
	.middleware([localeMiddleware])
	.validator(OTPFormSchema)
	.handler(async ({ data, context }) => {
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

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const verifyMutation = useMutation({
		mutationFn: verifyOTPFn,
		onSuccess: () => {
			navigate({
				to: search.redirect ?? "/$locale/admin",
			});
		},
	});

	return (
		<FloatingPage>
			<div className="max-w-md w-full">
				<PageHeader
					title="Verify Email"
					description="Enter the code we sent you to verify your email"
				/>
				<OTPForm
					onSubmit={(data) => verifyMutation.mutateAsync({ data })}
				/>
			</div>
		</FloatingPage>
	);
}
