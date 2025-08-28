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
import {
	createModuleFn,
	createModulePresignedURLFn,
	deleteModuleFn,
	getModulesFn,
} from "@/server/handlers/courses.modules";
import type { Module } from "@/types/module";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute(
	"/$locale/admin/courses/$courseId/modules",
)({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ params: param, deps }) =>
		getModulesFn({
			data: {
				courseId: param.courseId,
			},
			headers: {
				...(deps.locale && { locale: deps.locale }),
				fallbackLocale: "none",
			},
		}),
});

function RouteComponent() {
	const param = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const modules = Route.useLoaderData();
	const router = useRouter();
	const t = useTranslations("Modules");
	const tActions = useTranslations("Actions");
	const tForm = useTranslations("ModuleForm");

	const [open, setOpen] = useState(false);

	const createModulePresignedURL = useMutation({
		mutationFn: createModulePresignedURLFn,
	});
	const createModule = useMutation({
		mutationFn: createModuleFn,
		onSuccess: () => {
			setOpen(false);
			router.invalidate();
		},
	});
	const deleteModule = useMutation({
		mutationFn: deleteModuleFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

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
						data: { moduleId: id, courseId },
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
										data: { courseId: param.courseId },
										headers: {
											...(search.locale && {
												locale: search.locale,
											}),
										},
									});
								await fetch(url, {
									method: "PUT",
									body: values.file,
								});
								await createModule.mutateAsync({
									data: { courseId: param.courseId },
									headers: {
										...(search.locale && {
											locale: search.locale,
										}),
									},
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
