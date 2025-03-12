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
import { queryOptions, useMutationOptions } from "@/lib/api";
import { locales } from "@/lib/locale";
import { Module } from "@/types/module";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/$locale/admin/courses/$id/modules")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ params: param, context: { queryClient } }) => {
		await queryClient.ensureQueryData(
			queryOptions.modules.all({
				param,
			}),
		);
	},
});

function RouteComponent() {
	const param = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const { data: modules } = useSuspenseQuery(
		queryOptions.modules.all({
			param,
		}),
	);

	const [open, setOpen] = useState(false);

	const mutationOptions = useMutationOptions();
	const createModule = useMutation(mutationOptions.course.modules.create);
	const deleteModule = useMutation(mutationOptions.course.modules.delete);

	const columns: ColumnDef<Module>[] = [
		{
			accessorKey: "id",
			header: ({ column }) => (
				<DataTableColumnHeader title="ID" column={column} />
			),
		},
		{
			accessorKey: "type",
			header: ({ column }) => (
				<DataTableColumnHeader title="Type" column={column} />
			),
		},
		{
			accessorKey: "versionNumber",
			header: ({ column }) => (
				<DataTableColumnHeader title="Version" column={column} />
			),
		},
		createDataTableActionsColumn<Module>([
			{
				name: "Delete",
				onClick: ({ id, courseId }) => {
					deleteModule.mutate({
						param: { moduleId: id, id: courseId },
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
							onSubmit={(values) =>
								createModule.mutateAsync(
									{
										form: values,
										param,
									},
									{
										onSuccess: () => {
											setOpen(false);
										},
									},
								)
							}
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
