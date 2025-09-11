import { KokobiLogo } from "@/components/KokobiLogo";
import { OrganizationIcon } from "@/components/OrganizationIcon";
import { FloatingPage, PageHeader } from "@/components/Page";
import { useAppForm } from "@/components/ui/form";
import { authClient } from "@/lib/auth.client";
import { organizationImageUrl } from "@/lib/file";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const RedirectSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/$locale/auth/login")({
	component: RouteComponent,
	validateSearch: RedirectSchema,
	beforeLoad: async ({ params, context: { queryClient } }) => {
		try {
			const auth = await queryClient.ensureQueryData(
				orpc.auth.session.queryOptions(),
			);
			if (auth) throw redirect({ to: "/$locale/admin", params });
		} catch (e) {}
	},
	loader: async ({ context: { queryClient } }) => {
		const tenant = await queryClient.ensureQueryData(
			orpc.auth.tenant.queryOptions(),
		);
		if (tenant) {
			await queryClient.ensureQueryData(
				orpc.organization.id.queryOptions({
					input: {
						id: tenant.id,
					},
				}),
			);
		}
	},
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
	const navigate = Route.useNavigate();

	const { data: tenant } = useSuspenseQuery(orpc.auth.tenant.queryOptions());
	const { data: organization } = useQuery(
		orpc.organization.id.queryOptions({
			input: {
				id: tenant?.id!,
			},
			enabled: !!tenant?.id,
		}),
	);

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

	return (
		<>
			<div className="pt-6 pl-6">
				{organization ? (
					<OrganizationIcon
						src={organizationImageUrl(organization, "logo")}
						className="bg-popover"
					/>
				) : (
					<KokobiLogo />
				)}
			</div>

			<FloatingPage contentClassname="border-e-4 border-primary/20 border rounded-lg p-10 shadow-lg bg-popover">
				<PageHeader title={t.title} description={t.description}>
					<p className="text-sm text-muted-foreground">
						{t.newUserNote}
					</p>
				</PageHeader>
				<LoginForm
					onSubmit={(values) => requestMutation.mutateAsync(values)}
				/>
			</FloatingPage>
		</>
	);
}
