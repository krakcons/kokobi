import { TeamForm } from "@/components/forms/TeamForm";
import { FloatingPage, Page, PageHeader } from "@/components/Page";
import { useMutationOptions } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/create-team")({
	component: RouteComponent,
});

function RouteComponent() {
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
					onSubmit={(values) => {
						createTeam.mutate(
							{
								form: {
									name: values.name,
								},
							},
							{
								onSuccess: () => {
									navigate({ to: "/$locale/admin" });
								},
							},
						);
					}}
				/>
			</div>
		</FloatingPage>
	);
}
