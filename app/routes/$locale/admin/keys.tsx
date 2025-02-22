import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { queryOptions, useMutationOptions } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Key } from "@/types/keys";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/$locale/admin/keys")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(queryOptions.keys.all);
	},
});

const APIKeyCell = ({ secret }: { secret: string }) => {
	const [hidden, setHidden] = useState(true);
	const [copied, setCopied] = useState(false);
	return (
		<div className="flex items-center">
			<code className={cn("text-sm mr-2", hidden ? "pt-1" : "")}>
				{hidden ? secret.replaceAll(/./g, "*") : secret}
			</code>
			<Button
				size="icon"
				variant="ghost"
				onClick={() => setHidden(!hidden)}
			>
				{hidden ? (
						<Eye className="size-5" />
				) : (
						<EyeOff className="size-5" />
				)}
			</Button>
			<Button
				size="icon"
				variant="ghost"
				disabled={copied}
				onClick={() => {
					navigator.clipboard.writeText(secret);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				}}
			>
				{copied ? (
					<></>
				) : (
					//<ClipboardCheck className="size-5" />
					<></>
					//<Clipboard className="size-5" />
				)}
			</Button>
		</div>
	);
};

function RouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();

	const { data: keys } = useSuspenseQuery(queryOptions.keys.all);

	const mutationOptions = useMutationOptions();
	const deleteKey = useMutation(mutationOptions.keys.delete);

	const columns: ColumnDef<Key>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader title="Name" column={column} />
			),
		},
		{
			accessorKey: "key",
			header: ({ column }) => (
				<DataTableColumnHeader title="Key" column={column} />
			),
			cell: ({ cell }) => <APIKeyCell secret={cell.row.original.key} />,
		},
		createDataTableActionsColumn<Key>([
			{
				name: "Delete",
				onClick: (data) => {
					deleteKey.mutate({
						param: {
							id: data.id,
						},
					});
				},
			},
		]),
	];

	return (
		<Page>
			<PageHeader title="Keys" description="Manage your API keys" />
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
