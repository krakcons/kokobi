import { FloatingPage, PageHeader } from "@/components/Page";
import { useAppForm } from "@/components/ui/form";
import { getTeamByIdFn, getTenantFn } from "@/server/handlers/teams";
import { requestOTPFn } from "@/server/handlers/auth.otp";
import { LoginFormSchema, LoginFormType } from "@/types/auth";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { TeamIcon } from "@/components/TeamIcon";
import { teamImageUrl } from "@/lib/file";
import { Team, TeamTranslation } from "@/types/team";
import { getAuthFn } from "@/server/handlers/auth";
import { useTranslations } from "@/lib/locale";

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

const LoginForm = ({
	onSubmit,
	defaultValues,
}: {
	onSubmit: (data: LoginFormType) => Promise<any>;
	defaultValues?: LoginFormType;
}) => {
	const t = useTranslations("LoginForm");
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
	const t = useTranslations("Login");

	return (
		<FloatingPage>
			{team && (
				<TeamIcon src={teamImageUrl(team, "logo")} className="mb-8" />
			)}
			<PageHeader title={t.title} description={t.description} />
			<LoginForm
				onSubmit={(data) => requestMutation.mutateAsync({ data })}
			/>
		</FloatingPage>
	);
}
