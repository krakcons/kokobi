import { FloatingPage, PageHeader } from "@/components/Page";
import { useAppForm } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { RedirectSchema } from "./login";
import { verifyOTPFn } from "@/server/handlers/auth.otp";
import { OTPFormSchema, OTPFormType } from "@/types/auth";
import { getAuthFn } from "@/server/handlers/auth";
import { useTranslations } from "@/lib/locale";

export const Route = createFileRoute("/$locale/auth/verify-email")({
	component: RouteComponent,
	validateSearch: RedirectSchema,
	beforeLoad: async ({ params }) => {
		const auth = await getAuthFn();
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
		mutationFn: verifyOTPFn,
		onSuccess: () => {
			navigate({
				to: search.redirect ?? "/$locale/admin",
				search: (s) => ({ ...s, redirect: undefined }),
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
