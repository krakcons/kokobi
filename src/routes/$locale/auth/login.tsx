import { PageHeader } from "@/components/Page";
import { useAppForm } from "@/components/ui/form";
import { authClient } from "@/lib/auth.client";
import { useTranslations } from "@/lib/locale";
import { SearchSchema } from "@/types/router";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/$locale/auth/login")({
	component: RouteComponent,
	validateSearch: SearchSchema,
});

export const LoginFormSchema = z.object({
	email: z.email(),
	rememberMe: z.boolean().optional(),
});
export type LoginFormType = z.infer<typeof LoginFormSchema>;

const LoginForm = ({
	onSubmit,
	defaultValues,
}: {
	onSubmit: (data: LoginFormType) => Promise<any>;
	defaultValues?: LoginFormType;
}) => {
	const t = useTranslations("AuthLoginForm");
	const form = useAppForm({
		defaultValues: {
			...defaultValues,
			email: "",
			rememberMe: false,
		} as LoginFormType,
		validators: {
			onSubmit: LoginFormSchema,
		},
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<form
				className="flex flex-col gap-10"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<div className="flex flex-col gap-4">
					<form.AppField
						name="email"
						children={(field) => (
							<field.TextField label={t.email} />
						)}
					/>
					<form.AppField
						name="rememberMe"
						children={(field) => (
							<field.CheckboxField label={t.rememberMe} />
						)}
					/>
				</div>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};

function RouteComponent() {
	const { redirect, redirectContext, redirectType } = Route.useSearch();
	const navigate = Route.useNavigate();

	const requestMutation = useMutation({
		mutationFn: ({ email }: LoginFormType) =>
			authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" }),
		onSuccess: (_, { email, rememberMe }) => {
			navigate({
				to: "/$locale/auth/verify-email",
				params: (p) => p,
				search: (s) => ({
					...s,
					email,
					rememberMe: rememberMe ? true : undefined,
				}),
			});
		},
	});
	const t = useTranslations("AuthLogin");

	let titleMap = {
		course: `${t.redirectToCourse} ${redirectContext} ${t.redirectCourse}`,
		collection: `${t.redirectToCollection} ${redirectContext} ${t.redirectCollection}`,
		learner_panel: t.redirectToLearnerPanel,
		admin_panel: t.redirectToAdminPanel,
	};
	let title = redirectType ? titleMap[redirectType] : t.title;

	return (
		<>
			<PageHeader
				title={title}
				titlesize="md"
				description={t.description}
			>
				<p className="text-sm text-muted-foreground">{t.newUserNote}</p>
			</PageHeader>
			<LoginForm
				onSubmit={(values) => requestMutation.mutateAsync(values)}
			/>
		</>
	);
}
