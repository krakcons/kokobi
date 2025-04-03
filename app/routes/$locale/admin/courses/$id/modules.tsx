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
import { locales } from "@/lib/locale";
import {
	createModuleFn,
	deleteModuleFn,
	getModulesFn,
} from "@/server/handlers/modules";
import { Module } from "@/types/module";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/$locale/admin/courses/$id/modules")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ params: param, deps }) =>
		getModulesFn({
			data: {
				courseId: param.id,
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

	const [open, setOpen] = useState(false);

	const createModule = useMutation({
		mutationFn: createModuleFn,
		onSuccess: () => {
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
				<DataTableColumnHeader title="Version" column={column} />
			),
		},
		{
			accessorKey: "language",
			accessorFn: ({ language }) =>
				locales.find((l) => l.value === language)?.label,
			header: ({ column }) => (
				<DataTableColumnHeader title="Language" column={column} />
			),
		},
		{
			accessorKey: "type",
			header: ({ column }) => (
				<DataTableColumnHeader title="Type" column={column} />
			),
		},
		createDataTableActionsColumn<Module>([
			{
				name: "Delete",
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
			<PageHeader
				title="Modules"
				description="Manage the modules for this course."
			>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus />
							Create
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create Module</DialogTitle>
							<DialogDescription>
								Upload a scorm module below.
							</DialogDescription>
						</DialogHeader>
						<ModuleForm
							key={modules.length}
							onSubmit={(values) => {
								const formData = new FormData();
								formData.append("file", values.file);
								formData.append("courseId", param.id);
								return createModule.mutateAsync(
									{
										data: formData,
										headers: {
											...(search.locale && {
												locale: search.locale,
											}),
										},
									},
									{
										onSuccess: () => {
											setOpen(false);
										},
									},
								);
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
