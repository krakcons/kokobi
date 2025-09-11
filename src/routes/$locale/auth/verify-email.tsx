import { PageHeader } from "@/components/Page";
import { useAppForm } from "@/components/ui/form";
import { authClient } from "@/lib/auth.client";
import { useTranslations } from "@/lib/locale";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { RedirectSchema } from "../auth";

export const Route = createFileRoute("/$locale/auth/verify-email")({
	component: RouteComponent,
	validateSearch: RedirectSchema.extend({
		email: z.email(),
		rememberMe: z.boolean().optional(),
	}),
});

export const OTPFormSchema = z.object({
	code: z.string().min(6).max(6),
});
export type OTPFormType = z.infer<typeof OTPFormSchema>;

const OTPForm = ({
	onSubmit,
}: {
	onSubmit: (data: OTPFormType) => Promise<any>;
}) => {
	const t = useTranslations("AuthVerifyEmailForm");
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
					children={(field) => (
						<field.TextField
							label={t.code.label}
							autoComplete="off"
						/>
					)}
				/>

				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};

function RouteComponent() {
	const search = Route.useSearch();
	const { rememberMe = false } = search;
	const navigate = Route.useNavigate();
	const t = useTranslations("AuthVerifyEmail");

	const verifyMutation = useMutation({
		mutationFn: ({
			code,
			rememberMe,
		}: OTPFormType & { rememberMe: boolean }) =>
			authClient.signIn.emailOtp(
				{
					otp: code,
					email: search.email,
				},
				{
					body: {
						rememberMe,
					},
				},
			),
		onSuccess: () => {
			navigate({
				to: search.redirect ?? "/$locale/admin",
				search: (s) => ({
					...s,
					redirect: undefined,
					email: undefined as any,
					rememberMe: undefined,
				}),
			});
		},
	});

	return (
		<>
			<PageHeader title={t.title} description={t.description} />
			<OTPForm
				onSubmit={(values) =>
					verifyMutation.mutateAsync({
						...values,
						rememberMe,
					})
				}
			/>
		</>
	);
}
