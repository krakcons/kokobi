import { TeamForm } from "@/components/forms/TeamForm";
import { FloatingPage, PageHeader } from "@/components/Page";
import { useLocale, useTranslations } from "@/lib/locale";
import { createTeamFn } from "@/server/handlers/teams";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/create-team")({
	component: RouteComponent,
});

function RouteComponent() {
	const locale = useLocale();
	const t = useTranslations("TeamForm");
	const navigate = Route.useNavigate();
	const createTeam = useMutation({
		mutationFn: createTeamFn,
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
	});

	return (
		<FloatingPage>
			<PageHeader
				title={t.create.title}
				description={t.create.description}
			/>
			<TeamForm
				collapsible
				onSubmit={(values) => {
					const formData = new FormData();
					for (const [key, value] of Object.entries(values)) {
						formData.append(key, value);
					}
					return createTeam.mutateAsync({ data: formData });
				}}
			/>
		</FloatingPage>
	);
}
