import { TeamForm } from "@/components/forms/TeamForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { fetchFile } from "@/lib/file";
import { env } from "@/env";
import { deleteTeamFn, getTeamFn, updateTeamFn } from "@/server/handlers/teams";

export const Route = createFileRoute("/$locale/admin/settings")({
	component: RouteComponent,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ deps }) =>
		getTeamFn({
			headers: {
				locale: deps.locale ?? "",
				fallbackLocale: "none",
			},
		}),
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const team = Route.useLoaderData();
	console.log(team);
	const router = useRouter();

	const updateTeam = useMutation({
		mutationFn: updateTeamFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const deleteTeam = useMutation({
		mutationFn: deleteTeamFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	const { data } = useQuery({
		queryKey: ["team-logo-favicon", team.id],
		queryFn: async () => {
			const logo = await fetchFile(
				`${env.VITE_SITE_URL}/cdn/${team.id}/${team.language}/logo?updatedAt=${team.updatedAt}`,
			);
			const favicon = await fetchFile(
				`${env.VITE_SITE_URL}/cdn/${team.id}/${team.language}/favicon?updatedAt=${team.updatedAt}`,
			);
			return { logo, favicon };
		},
	});

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
					...data,
				}}
				onSubmit={(values) => {
					const formData = new FormData();
					Object.entries(values).forEach(([key, value]) => {
						formData.append(key, value);
					});
					return updateTeam.mutateAsync({
						data: formData,
						headers: {
							locale: search.locale ?? "",
						},
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
