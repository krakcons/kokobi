import { FloatingPage, PageHeader } from "@/components/Page";
import { useAppForm } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { RedirectSchema } from "./login";
import { OTPFormSchema, type OTPFormType } from "@/types/auth";
import { useTranslations } from "@/lib/locale";
import { authClient } from "@/lib/auth.client";
import z from "zod";
import { orpc } from "@/server/client";

export const Route = createFileRoute("/$locale/auth/verify-email")({
	component: RouteComponent,
	validateSearch: RedirectSchema.extend({
		email: z.email(),
	}),
	beforeLoad: async ({ params, context: { queryClient } }) => {
		const auth = await queryClient.ensureQueryData(
			orpc.auth.session.queryOptions(),
		);
		if (auth.session) throw redirect({ to: "/$locale/admin", params });
	},
});

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
	const navigate = Route.useNavigate();
	const t = useTranslations("AuthVerifyEmail");

	const verifyMutation = useMutation({
		mutationFn: ({ data: { code } }: { data: { code: string } }) =>
			authClient.signIn.emailOtp({
				otp: code,
				email: search.email,
			}),
		onSuccess: () => {
			navigate({
				to: search.redirect ?? "/$locale/admin",
				search: (s) => ({
					...s,
					redirect: undefined,
					email: undefined as any,
				}),
			});
		},
	});

	return (
		<FloatingPage>
			<PageHeader title={t.title} description={t.description} />
			<OTPForm
				onSubmit={(data) => verifyMutation.mutateAsync({ data })}
			/>
		</FloatingPage>
	);
}
