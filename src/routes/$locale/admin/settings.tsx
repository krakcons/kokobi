import { TeamForm } from "@/components/forms/TeamForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { fetchFile, organizationImageUrl } from "@/lib/file";

import { DomainFormSchema, type DomainFormType } from "@/types/domains";
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
import { orpc } from "@/server/client";

export const Route = createFileRoute("/$locale/admin/settings")({
	component: RouteComponent,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ deps, context: { queryClient } }) =>
		Promise.all([
			queryClient.ensureQueryData(
				orpc.organization.current.queryOptions({
					context: {
						headers: {
							locale: deps.locale,
							fallbackLocale: "none",
						},
					},
				}),
			),
			queryClient.ensureQueryData(
				orpc.organization.domain.get.queryOptions(),
			),
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
	const router = useRouter();
	const t = useTranslations("TeamSettings");
	const tActions = useTranslations("Actions");
	const tDomain = useTranslations("TeamDomainForm");
	const queryClient = useQueryClient();

	const { data: organization } = useSuspenseQuery(
		orpc.organization.current.queryOptions({
			context: {
				headers: {
					locale: search.locale,
					fallbackLocale: "none",
				},
			},
		}),
	);

	const { data: domain } = useSuspenseQuery(
		orpc.organization.domain.get.queryOptions(),
	);

	const createDomain = useMutation(
		orpc.organization.domain.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.organization.domain.get.queryOptions(),
				);
			},
		}),
	);
	const updateOrganization = useMutation(
		orpc.organization.update.mutationOptions({
			context: {
				headers: {
					locale: search.locale,
				},
			},
			onSuccess: () => {
				toast.success("Organization updated");
				router.invalidate();
			},
		}),
	);
	const deleteOrganization = useMutation(
		orpc.organization.delete.mutationOptions({
			onSuccess: () => {
				navigate({ to: "/$locale/admin" });
			},
		}),
	);
	const deleteOrganizationDomain = useMutation(
		orpc.organization.domain.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.organization.domain.get.queryOptions(),
				);
			},
		}),
	);

	const { data } = useQuery({
		queryKey: [
			"organization-logo-favicon",
			organization.logo,
			organization.favicon,
			organization.updatedAt,
		],
		queryFn: async () => {
			return {
				logo: organization.logo
					? await fetchFile(
							organizationImageUrl(organization, "logo"),
						)
					: null,
				favicon: organization.favicon
					? await fetchFile(
							organizationImageUrl(organization, "favicon"),
						)
					: null,
			};
		},
	});

	return (
		<Page>
			<PageHeader title={t.title} description={t.description}>
				<Badge variant="secondary">
					<p>{organization.id}</p>
					<CopyButton text={organization.id} />
				</Badge>
			</PageHeader>
			<TeamForm
				key={organization.locale}
				defaultValues={{
					logo: data?.logo ?? "",
					favicon: data?.favicon ?? "",
					name: organization.name,
				}}
				onSubmit={(values) => updateOrganization.mutateAsync(values)}
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
										deleteOrganizationDomain.mutate({
											id: domain.id,
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
					onSubmit={async (data) => createDomain.mutateAsync(data)}
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
								deleteOrganization.mutate({});
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
