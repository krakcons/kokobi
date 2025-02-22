import { TeamForm } from "@/components/forms/TeamForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { queryOptions, useMutationOptions } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";

export const Route = createFileRoute("/$locale/admin/settings")({
	component: RouteComponent,
	loader: async ({ context: { queryClient } }) => {
		const preferences = await queryClient.ensureQueryData(
			queryOptions.user.preferences,
		);
		const team = await queryClient.ensureQueryData(
			queryOptions.team.me({
				query: {
					"fallback-locale": "none",
				},
			}),
		);
		await queryClient.ensureQueryData(
			queryOptions.team.images({
				locale: preferences.locale,
				teamId: team.id,
			}),
		);
	},
});

function RouteComponent() {
	const locale = useLocale();
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();
	const { data: team } = useSuspenseQuery(
		queryOptions.team.me({
			query: {
				"fallback-locale": "none",
			},
		}),
	);

	const { data: images } = useSuspenseQuery(
		queryOptions.team.images({
			locale,
			teamId: team.id,
		}),
	);

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
					name: team.name,
					...images,
				}}
				onSubmit={(values) => {
					updateTeam.mutate({
						form: values,
					});
				}}
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
