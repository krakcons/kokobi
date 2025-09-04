import { FloatingPage, PageHeader } from "@/components/Page";
import { useAppForm } from "@/components/ui/form";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { TeamIcon } from "@/components/TeamIcon";
import { organizationImageUrl } from "@/lib/file";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import type { Organization } from "@/types/team";
import { authClient } from "@/lib/auth.client";

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
		const tenantId = await queryClient.ensureQueryData(
			orpc.auth.tenant.queryOptions(),
		);
		console.log("TENANT ID", tenantId);
		let organization: Organization | undefined = undefined;
		if (tenantId) {
			console.log("GETTING TENANT");
			const tenant = await queryClient.ensureQueryData(
				orpc.organization.id.queryOptions({
					input: {
						id: tenantId,
					},
				}),
			);
			organization = tenant;
		}
	},
});

export const LoginFormSchema = z.object({
	email: z.email(),
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
					children={(field) => (
						<field.TextField label={t.email.label} />
					)}
				/>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};

function RouteComponent() {
	const navigate = Route.useNavigate();

	const { data: tenantId } = useSuspenseQuery(
		orpc.auth.tenant.queryOptions(),
	);
	const { data: organization } = useQuery(
		orpc.organization.id.queryOptions({
			input: {
				id: tenantId!,
			},
			enabled: !!tenantId,
		}),
	);

	const requestMutation = useMutation({
		mutationFn: ({ data: { email } }: { data: { email: string } }) =>
			authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" }),
		onSuccess: (_, { data: { email } }) => {
			navigate({
				to: "/$locale/auth/verify-email",
				params: (p) => p,
				search: (s) => ({
					...s,
					email,
				}),
			});
		},
	});
	const t = useTranslations("AuthLogin");

	return (
		<FloatingPage>
			{organization && (
				<TeamIcon
					src={organizationImageUrl(organization, "logo")}
					className="my-4"
				/>
			)}
			<PageHeader title={t.title} description={t.description} />
			<LoginForm
				onSubmit={(data) => requestMutation.mutateAsync({ data })}
			/>
		</FloatingPage>
	);
}
