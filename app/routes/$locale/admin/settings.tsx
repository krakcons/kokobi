import { TeamForm } from "@/components/forms/TeamForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { fetchFile } from "@/lib/file";
import { env } from "@/env";
import {
	createDomainFn,
	deleteTeamDomainFn,
	getTeamDomainFn,
} from "@/server/handlers/domains";
import { DomainFormSchema, DomainFormType } from "@/types/domains";
import { deleteTeamFn, getTeamFn, updateTeamFn } from "@/server/handlers/teams";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import CopyButton from "@/components/CopyButton";
import { toast } from "sonner";

export const Route = createFileRoute("/$locale/admin/settings")({
	component: RouteComponent,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ deps }) =>
		Promise.all([
			getTeamFn({
				data: {
					type: "admin",
				},
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
			toast.success("Team updated");
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
		queryKey: ["team-logo-favicon", team.id, team.locale, team.updatedAt],
		queryFn: async () => {
			const logo = await fetchFile(
				`${env.VITE_SITE_URL}/cdn/${team.id}/${team.locale}/logo?updatedAt=${team.updatedAt}`,
			);
			const favicon = await fetchFile(
				`${env.VITE_SITE_URL}/cdn/${team.id}/${team.locale}/favicon?updatedAt=${team.updatedAt}`,
			);
			return { logo, favicon };
		},
	});

	return (
		<Page>
			<PageHeader title="Settings" description="Edit your team settings">
				<Badge variant="secondary">
					<p>{team.id}</p>
					<CopyButton text={team.id} />
				</Badge>
			</PageHeader>
			<TeamForm
				key={team.locale}
				defaultValues={{
					logo: "",
					favicon: "",
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
									domainId: domain.id,
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
				<div className="w-[calc(100vw-32px)] rounded-md sm:w-full">
					<ScrollArea className="pb-2">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Status</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Value</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className="px-2">
								{domain.records.map((record) => (
									<TableRow key={record.value}>
										<TableCell>
											<Badge
												variant={
													record.status.toUpperCase() ===
													"SUCCESS"
														? "success"
														: record.status.toUpperCase() ===
															  "OPTIONAL"
															? "secondary"
															: "destructive"
												}
											>
												{record.status?.toUpperCase()}
											</Badge>
										</TableCell>
										<TableCell>{record.type}</TableCell>
										<TableCell>
											<span className="flex items-center">
												<CopyButton
													text={record.name ?? ""}
												/>
												{record.name}
											</span>
										</TableCell>
										<TableCell>
											<span className="flex items-center gap-4">
												<span className="flex items-center">
													<CopyButton
														text={record.value}
													/>
													{record.value}
												</span>
												{record.priority && (
													<p>
														<strong>
															Priority:
														</strong>
														{" " + record.priority}
													</p>
												)}
											</span>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>
			) : (
				<DomainForm
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
