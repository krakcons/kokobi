import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import ModuleForm from "@/components/forms/ModuleForm";
import { Page, PageHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { locales, useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import type { Module } from "@/types/module";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute(
	"/$locale/admin/courses/$courseId/modules",
)({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ params: param, deps, context: { queryClient } }) =>
		queryClient.ensureQueryData(
			orpc.course.modules.get.queryOptions({
				input: {
					id: param.courseId,
				},
				context: {
					headers: {
						locale: deps.locale,
						fallbackLocale: "none",
					},
				},
			}),
		),
});

function RouteComponent() {
	const param = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const t = useTranslations("Modules");
	const tActions = useTranslations("Actions");
	const queryClient = useQueryClient();
	const tForm = useTranslations("ModuleForm");

	const [open, setOpen] = useState(false);

	const { data: modules } = useSuspenseQuery(
		orpc.course.modules.get.queryOptions({
			input: {
				id: param.courseId,
			},
			context: {
				headers: {
					locale: search.locale,
					fallbackLocale: "none",
				},
			},
		}),
	);

	const createModulePresignedURL = useMutation(
		orpc.course.modules.presign.mutationOptions({
			context: {
				headers: {
					locale: search.locale,
				},
			},
		}),
	);
	const createModule = useMutation(
		orpc.course.modules.create.mutationOptions({
			context: {
				headers: {
					locale: search.locale,
				},
			},
			onSuccess: () => {
				setOpen(false);
				queryClient.invalidateQueries({
					queryKey: orpc.course.modules.get.queryKey({
						input: {
							id: param.courseId,
						},
					}),
				});
			},
		}),
	);
	const deleteModule = useMutation(
		orpc.course.modules.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.course.modules.get.queryKey({
						input: {
							id: param.courseId,
						},
					}),
				});
			},
		}),
	);

	const columns: ColumnDef<Module>[] = [
		{
			accessorKey: "versionNumber",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={t.table.version}
					column={column}
				/>
			),
		},
		{
			accessorKey: "locale",
			accessorFn: ({ locale }) =>
				locales.find((l) => l.value === locale)?.label,
			header: ({ column }) => (
				<DataTableColumnHeader title={t.table.locale} column={column} />
			),
		},
		{
			accessorKey: "type",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.table.type} column={column} />
			),
		},
		createDataTableActionsColumn<Module>([
			{
				name: tActions.delete,
				onClick: ({ id, courseId }) => {
					deleteModule.mutate({
						moduleId: id,
						id: courseId,
					});
				},
			},
		]),
	];

	return (
		<Page>
			<PageHeader title={t.title} description={t.description}>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus />
							{tActions.create}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{tForm.title}</DialogTitle>
							<DialogDescription>
								{tForm.description}
							</DialogDescription>
						</DialogHeader>
						<ModuleForm
							key={modules.length}
							onSubmit={async (values) => {
								const url =
									await createModulePresignedURL.mutateAsync({
										id: param.courseId,
									});
								await fetch(url, {
									method: "PUT",
									body: values.file,
								});
								await createModule.mutateAsync({
									id: param.courseId,
								});
							}}
						/>
					</DialogContent>
				</Dialog>
			</PageHeader>
			<DataTable
				columns={columns}
				data={modules.map((module) => ({
					...module,
					createdAt: new Date(module.createdAt),
					updatedAt: new Date(module.updatedAt),
				}))}
				search={search}
				onSearchChange={(value) => {
					navigate({
						search: value,
					});
				}}
			/>
		</Page>
	);
}
