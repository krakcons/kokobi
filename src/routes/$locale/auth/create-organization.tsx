import { OrganizationForm } from "@/components/forms/OrganizationForm";
import { PageHeader } from "@/components/Page";
import { useLocale, useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/auth/create-organization")({
	component: RouteComponent,
});

function RouteComponent() {
	const locale = useLocale();
	const t = useTranslations("OrganizationForm");
	const navigate = Route.useNavigate();
	const createOrganization = useMutation(
		orpc.organization.create.mutationOptions(
			orpc.organization.create.mutationOptions({
				onSuccess: () => {
					navigate({
						to: "/$locale/admin",
						params: {
							locale,
						},
						search: (s) => s,
						reloadDocument: true,
					});
				},
			}),
		),
	);

	return (
		<>
			<PageHeader
				title={t.create.title}
				description={t.create.description}
			/>
			<OrganizationForm
				collapsible
				onSubmit={(values) => {
					return createOrganization.mutateAsync(values);
				}}
			/>
		</>
	);
}
