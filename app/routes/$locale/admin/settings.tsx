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
	createDomainFn,
	deleteTeamDomainFn,
	deleteTeamFn,
	DomainFormSchema,
	DomainFormType,
	getTeamDomainFn,
	getTeamFn,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
			hostname: undefined,
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
					name="hostname"
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
	const [team, domain] = Route.useLoaderData();
	const router = useRouter();

	const createDomain = useMutation({
		mutationFn: createDomainFn,
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
	const deleteTeamDomain = useMutation({
		mutationFn: deleteTeamDomainFn,
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
			>
				{domain && (
					<Button
						variant="destructive"
						onClick={() =>
							deleteTeamDomain.mutate({
								data: {
									hostnameId: domain.hostnameId,
								},
							})
						}
					>
						<Trash />
						Delete
					</Button>
				)}
			</PageSubHeader>
			{domain ? (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Status</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Value</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell>
									<Badge
										className={cn(
											domain.cloudflare.status ===
												"active"
												? "bg-green-500"
												: "bg-red-500",
										)}
									>
										{domain.cloudflare.status
											.slice(0, 1)
											.toUpperCase() +
											domain.cloudflare.status.slice(1)}
									</Badge>
								</TableCell>
								<TableCell>CNAME</TableCell>
								<TableCell>{domain.hostname}</TableCell>
								<TableHead>kokobi.org</TableHead>
							</TableRow>
						</TableBody>
					</Table>
				</>
			) : (
				<DomainForm
					defaultValues={team}
					onSubmit={async (data) =>
						createDomain.mutateAsync({ data })
					}
				/>
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
