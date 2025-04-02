import { TeamForm } from "@/components/forms/TeamForm";
import { FloatingPage, PageHeader } from "@/components/Page";
import { useMutationOptions } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/create-team")({
	component: RouteComponent,
});

function RouteComponent() {
	const locale = useLocale();
	const mutationOptions = useMutationOptions();
	const createTeam = useMutation(mutationOptions.team.create);
	const navigate = Route.useNavigate();

	return (
		<FloatingPage>
			<div className="flex flex-col max-w-lg w-full">
				<PageHeader
					title="Create Team"
					description="Create a new team"
				/>
				<TeamForm
					collapsible
					onSubmit={(values) =>
						createTeam.mutateAsync(
							{
								form: values,
							},
							{
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
							},
						)
					}
				/>
			</div>
		</FloatingPage>
	);
}
