import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { APIKeyForm } from "@/components/forms/APIKeyForm";
import CopyButton from "@/components/CopyButton";
import { useLocale, useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import type { APIKey } from "@/types/api-keys";
import { formatDate } from "@/lib/date";

export const Route = createFileRoute("/$locale/admin/api-keys")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ context: { queryClient } }) =>
		await Promise.all([
			queryClient.ensureQueryData(orpc.apiKeys.get.queryOptions()),
		]),
});

const APIKeyCell = ({ secret, copy }: { secret: string; copy: boolean }) => {
	return (
		<div className="flex items-center">
			<code className={"text-sm mr-2"}>{secret}</code>
			{copy && <CopyButton text={secret} />}
		</div>
	);
};

function RouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const [open, setOpen] = useState(false);
	const t = useTranslations("APIKeys");
	const tForm = useTranslations("APIKeyForm");
	const tActions = useTranslations("Actions");
	const queryClient = useQueryClient();
	const locale = useLocale();

	const { data: keys } = useSuspenseQuery(orpc.apiKeys.get.queryOptions());

	const createKey = useMutation(
		orpc.apiKeys.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(orpc.apiKeys.get.queryOptions());
				setOpen(false);
			},
		}),
	);
	const deleteKey = useMutation(
		orpc.apiKeys.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(orpc.apiKeys.get.queryOptions());
			},
		}),
	);

	const columns: ColumnDef<APIKey>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.table.name} column={column} />
			),
		},
		{
			accessorKey: "start",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.table.key} column={column} />
			),
			cell: ({ cell }) => {
				const justCreated = Boolean(
					createKey.data?.key &&
						cell.row.original.id === createKey.data.id,
				);
				return (
					<APIKeyCell
						secret={
							justCreated
								? createKey.data!.key
								: cell.row.original.start + "..."
						}
						copy={justCreated}
					/>
				);
			},
		},
		{
			accessorKey: "lastRequest",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={t.table.lastRequest}
					column={column}
				/>
			),
			accessorFn: ({ lastRequest }) =>
				lastRequest ? formatDate({ date: lastRequest, locale }) : null,
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={t.table.createdAt}
					column={column}
				/>
			),
			accessorFn: ({ createdAt }) =>
				createdAt ? formatDate({ date: createdAt, locale }) : null,
		},
		{
			accessorKey: "user.name",
			header: ({ column }) => (
				<DataTableColumnHeader
					title={t.table.createdBy}
					column={column}
				/>
			),
		},
		createDataTableActionsColumn<APIKey>([
			{
				name: tActions.delete,
				onClick: (data) => {
					deleteKey.mutate({
						id: data.id,
					});
				},
			},
		]),
	];

	return (
		<Page>
			<PageHeader title={t.title} description={t.description}>
				<Dialog onOpenChange={setOpen} open={open}>
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
						<APIKeyForm
							onSubmit={(values) => createKey.mutateAsync(values)}
						/>
					</DialogContent>
				</Dialog>
			</PageHeader>
			<DataTable
				data={keys}
				columns={columns}
				search={search}
				onSearchChange={(search) => {
					navigate({
						search: (p) => ({
							...p,
							...search,
						}),
					});
				}}
			/>
		</Page>
	);
}
