import { TeamForm } from "@/components/forms/TeamForm";
import { Page, PageHeader } from "@/components/Page";
import { queryOptions, useMutationOptions } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/settings")({
	component: RouteComponent,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(
			queryOptions.team.me({
				query: {
					"fallback-locale": "none",
				},
			}),
		);
	},
});

const fetchFile = async (fileUrl: string) => {
	try {
		const response = await fetch(fileUrl);
		if (!response.ok) {
			return undefined;
		}
		const blob = await response.blob();
		const filename = fileUrl.split("/").pop(); // Extract filename from URL
		return new File([blob], filename!, { type: blob.type });
	} catch (error) {
		console.error("Error fetching file:", error);
	}
};

function RouteComponent() {
	const locale = useLocale();
	const { data: team } = useSuspenseQuery(
		queryOptions.team.me({
			query: {
				"fallback-locale": "none",
			},
		}),
	);

	const { data: images } = useSuspenseQuery({
		queryKey: ["images", team.id],
		queryFn: async () => {
			const logo = await fetchFile(
				`https://cdn.revivios.com/${team.id}/${locale}/logo`,
			);
			const favicon = await fetchFile(
				`https://cdn.revivios.com/${team.id}/${locale}/favicon`,
			);
			return { logo, favicon };
		},
	});

	const mutationOptions = useMutationOptions();
	const updateTeam = useMutation(mutationOptions.team.update);

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
					const formData = new FormData();

					formData.append("name", values.name);
					if (values.logo) {
						formData.append("logo", values.logo);
					}
					if (values.favicon) {
						formData.append("favicon", values.favicon);
					}

					updateTeam.mutate({
						form: {
							name: values.name,
							logo: values.logo,
							favicon: values.favicon,
						},
					});
				}}
			/>
		</Page>
	);
}
