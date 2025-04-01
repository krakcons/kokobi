import { TeamForm } from "@/components/forms/TeamForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { queryOptions, useMutationOptions } from "@/lib/api";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { fetchFile } from "@/lib/api";
import { Locale } from "@/lib/locale";
import { env } from "@/env";

const teamOptions = (locale?: Locale) =>
	queryOptions.team.me({
		query: {
			locale,
			"fallback-locale": "none",
		},
	});
const options = (locale?: Locale) => ({
	queryKey: teamOptions(locale).queryKey,
	queryFn: async () => {
		const data = await teamOptions(locale).queryFn();
		let logo: File | "" = "";
		let favicon: File | "" = "";
		// Only fetch if that team translation exists
		if (data.language) {
			logo = await fetchFile(
				`${env.VITE_API_URL}/cdn/${data.id}/${data.language}/logo?updatedAt=${data.updatedAt}`,
			);
			favicon = await fetchFile(
				`${env.VITE_API_URL}/cdn/${data.id}/${data.language}/favicon?updatedAt=${data.updatedAt}`,
			);
		}
		return { logo, favicon, ...data };
	},
});

export const Route = createFileRoute("/$locale/admin/settings")({
	component: RouteComponent,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: async ({ context: { queryClient }, deps }) => {
		await queryClient.ensureQueryData(options(deps.locale));
	},
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const { data: team } = useSuspenseQuery(options(search.locale));

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
						query: {
							locale: search.locale,
						},
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
