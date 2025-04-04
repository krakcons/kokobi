import { TeamForm } from "@/components/forms/TeamForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { fetchFile } from "@/lib/file";
import { env } from "@/env";
import {
	deleteTeamFn,
	DomainFormSchema,
	DomainFormType,
	getTeamDomainFn,
	getTeamFn,
	updateDomainFn,
	updateTeamFn,
} from "@/server/handlers/teams";
import { useAppForm } from "@/components/ui/form";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/$locale/admin/settings")({
	component: RouteComponent,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ deps }) =>
		Promise.all([
			getTeamFn({
				headers: {
					...(deps.locale && { locale: deps.locale }),
					fallbackLocale: "none",
				},
			}),
			getTeamDomainFn(),
		]),
});

const DomainForm = ({
	defaultValues,
	onSubmit,
}: {
	defaultValues?: DomainFormType;
	onSubmit: (values: DomainFormType) => Promise<any>;
}) => {
	const form = useAppForm({
		defaultValues: {
			customDomain: undefined,
			...defaultValues,
		} as DomainFormType,
		validators: {
			onSubmit: DomainFormSchema,
		},
		onSubmit: ({ value }) => onSubmit(value),
	});

	return (
		<form.AppForm>
			<form
				onSubmit={(e) => e.preventDefault()}
				className="flex flex-col gap-8"
			>
				<form.AppField
					name="customDomain"
					children={(field) => (
						<field.TextField label="Custom Domain" optional />
					)}
				/>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};

function RouteComponent() {
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const [team, domains] = Route.useLoaderData();
	const router = useRouter();

	console.log(domains);

	const updateDomain = useMutation({
		mutationFn: updateDomainFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
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
		queryKey: ["team-logo-favicon", team.id, team.language, team.updatedAt],
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
							...(search.locale && { locale: search.locale }),
						},
					});
				}}
			/>
			<Separator className="my-4" />
			<PageSubHeader
				title="Domain"
				description="Set a custom domain to serve your team's content"
			/>
			<DomainForm
				defaultValues={team}
				onSubmit={async (data) => updateDomain.mutateAsync({ data })}
			/>
			{team.customDomain && (
				<>
					<Separator className="my-4" />
					<PageSubHeader
						title="DNS"
						description="Required dns records for your custom domain"
					/>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Value</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell>CNAME</TableCell>
								<TableHead>
									{env.VITE_SITE_URL.split("://")[1]}
								</TableHead>
							</TableRow>
						</TableBody>
					</Table>
				</>
			)}
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
