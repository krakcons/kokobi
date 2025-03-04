import { TeamForm } from "@/components/forms/TeamForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { queryOptions, useMutationOptions } from "@/lib/api";
import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { fetchFile } from "@/lib/api";

const teamOptions = queryOptions.team.me({
	query: {
		"fallback-locale": "none",
	},
});
const options = {
	queryKey: teamOptions.queryKey,
	queryFn: async () => {
		const data = await teamOptions.queryFn();
		const logo = await fetchFile(
			`${window.location.origin}/cdn/${data.teamId}/${data.language}/logo?updatedAt=${data.updatedAt}`,
		);
		const favicon = await fetchFile(
			`${window.location.origin}/cdn/${data.teamId}/${data.language}/favicon?updatedAt=${data.updatedAt}`,
		);
		return { logo, favicon, ...data };
	},
};

export const Route = createFileRoute("/$locale/admin/settings")({
	component: RouteComponent,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(options);
	},
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();
	const { data: team } = useSuspenseQuery(options);

	const mutationOptions = useMutationOptions();
	const updateTeam = useMutation(mutationOptions.team.update);
	const deleteTeam = useMutation(mutationOptions.team.delete);

	return (
		<Page>
			<PageHeader
				title="Settings"
				description="Edit your team settings"
			/>
			<TeamForm
				key={team.language}
				defaultValues={{
					...team,
				}}
				onSubmit={(values) =>
					updateTeam.mutateAsync({
						form: values,
					})
				}
			/>
			<Separator className="my-4" />
			<PageSubHeader title="Domains" description="WIP" />
			<Separator className="my-4" />
			<PageSubHeader
				title="Delete Team"
				description="This will delete the team and all associated data. This action cannot be undone."
			/>
			<Button
				variant="destructive"
				onClick={() => {
					deleteTeam.mutate(undefined, {
						onSuccess: (data) => {
							if (data.teamId) {
								queryClient.invalidateQueries();
								navigate({ to: "/$locale/admin" });
							} else {
								navigate({ to: "/$locale/create-team" });
							}
						},
					});
				}}
				className="self-start"
			>
				<Trash />
				Delete
			</Button>
		</Page>
	);
}
