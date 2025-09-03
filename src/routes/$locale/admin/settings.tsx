import { TeamForm } from "@/components/forms/TeamForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { fetchFile, teamImageUrl } from "@/lib/file";
import {
	createTeamDomainFn,
	deleteTeamDomainFn,
	getTeamDomainFn,
} from "@/server/handlers/teams.domains";
import { DomainFormSchema, type DomainFormType } from "@/types/domains";
import { deleteTeamFn, updateTeamFn } from "@/server/handlers/teams";
import { useAppForm } from "@/components/ui/form";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import CopyButton from "@/components/CopyButton";
import { toast } from "sonner";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "@/lib/locale";

export const Route = createFileRoute("/$locale/admin/settings")({
	component: RouteComponent,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ deps }) =>
		Promise.all([
			getUserTeamFn({
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
	const t = useTranslations("TeamDomainForm");
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
						<field.TextField label={t.domain} optional />
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
	const t = useTranslations("TeamSettings");
	const tActions = useTranslations("Actions");
	const tDomain = useTranslations("TeamDomainForm");

	const createDomain = useMutation({
		mutationFn: createTeamDomainFn,
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
			navigate({ to: "/$locale/admin" });
		},
	});
	const deleteTeamDomain = useMutation({
		mutationFn: deleteTeamDomainFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	const { data } = useQuery({
		queryKey: [
			"team-logo-favicon",
			team.logo,
			team.favicon,
			team.updatedAt,
		],
		queryFn: async () => {
			return {
				logo: team.logo
					? await fetchFile(teamImageUrl(team, "logo"))
					: null,
				favicon: team.favicon
					? await fetchFile(teamImageUrl(team, "favicon"))
					: null,
			};
		},
	});

	return (
		<Page>
			<PageHeader title={t.title} description={t.description}>
				<Badge variant="secondary">
					<p>{team.id}</p>
					<CopyButton text={team.id} />
				</Badge>
			</PageHeader>
			<TeamForm
				key={team.locale}
				defaultValues={{
					logo: data?.logo ?? "",
					favicon: data?.favicon ?? "",
					name: team.name,
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
				title={tDomain.title}
				description={tDomain.description}
			>
				{domain && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="destructive"
								className="self-start"
							>
								<Trash />
								{tActions.delete}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									{t.domain.delete.confirm.title}
								</AlertDialogTitle>
								<AlertDialogDescription>
									{t.domain.delete.confirm.description}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>
									{tActions.cancel}
								</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => {
										deleteTeamDomain.mutate({
											data: {
												domainId: domain.id,
											},
										});
									}}
								>
									{tActions.continue}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</PageSubHeader>
			{domain ? (
				<div className="rounded-md">
					<ScrollArea className="pb-2">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t.domain.status}</TableHead>
									<TableHead>{t.domain.type}</TableHead>
									<TableHead>{t.domain.name}</TableHead>
									<TableHead>{t.domain.value}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className="px-2">
								{domain.records.map((record) => (
									<TableRow key={record.value}>
										<TableCell>
											<Badge
												// TODO: Needs translations
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
															{t.domain.priority}
														</strong>
														{" " + record.priority}
													</p>
												)}
											</span>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
							<TableCaption className="text-left">
								{t.domain.rootWarning}
							</TableCaption>
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
				title={t.delete.title}
				description={t.delete.description}
			/>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="destructive" className="self-start">
						<Trash />
						{tActions.delete}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t.delete.confirm.title}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t.delete.confirm.description}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tActions.cancel}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								deleteTeam.mutate({});
							}}
						>
							{tActions.continue}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Page>
	);
}
