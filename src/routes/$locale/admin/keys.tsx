import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Key } from "@/types/keys";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, EyeOff, Plus } from "lucide-react";
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
import { useTranslations } from "@/lib/locale";

export const Route = createFileRoute("/$locale/admin/keys")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
});

const APIKeyCell = ({ secret }: { secret: string }) => {
	const [hidden, setHidden] = useState(true);

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
			<CopyButton text={secret} />
		</div>
	);
};

function RouteComponent() {
	return <div>API Keys</div>;
	//const navigate = Route.useNavigate();
	//const search = Route.useSearch();
	//const [open, setOpen] = useState(false);
	//const keys = Route.useLoaderData();
	//const router = useRouter();
	//const t = useTranslations("APIKeys");
	//const tForm = useTranslations("APIKeyForm");
	//const tActions = useTranslations("Actions");
	//
	//const createKey = useMutation({
	//	mutationFn: createTeamKeyFn,
	//	onSuccess: () => {
	//		router.invalidate();
	//	},
	//});
	//const deleteKey = useMutation({
	//	mutationFn: deleteTeamKeyFn,
	//	onSuccess: () => {
	//		router.invalidate();
	//	},
	//});
	//
	//const columns: ColumnDef<Key>[] = [
	//	{
	//		accessorKey: "name",
	//		header: ({ column }) => (
	//			<DataTableColumnHeader title={t.table.name} column={column} />
	//		),
	//	},
	//	{
	//		accessorKey: "key",
	//		header: ({ column }) => (
	//			<DataTableColumnHeader title={t.table.key} column={column} />
	//		),
	//		cell: ({ cell }) => <APIKeyCell secret={cell.row.original.key} />,
	//	},
	//	createDataTableActionsColumn<Key>([
	//		{
	//			name: tActions.delete,
	//			onClick: (data) => {
	//				deleteKey.mutate({
	//					data: {
	//						id: data.id,
	//					},
	//				});
	//			},
	//		},
	//	]),
	//];
	//
	//return (
	//	<Page>
	//		<PageHeader title={t.title} description={t.description}>
	//			<Dialog onOpenChange={setOpen} open={open}>
	//				<DialogTrigger asChild>
	//					<Button>
	//						<Plus />
	//						{tActions.create}
	//					</Button>
	//				</DialogTrigger>
	//				<DialogContent>
	//					<DialogHeader>
	//						<DialogTitle>{tForm.title}</DialogTitle>
	//						<DialogDescription>
	//							{tForm.description}
	//						</DialogDescription>
	//					</DialogHeader>
	//					<APIKeyForm
	//						onSubmit={(values) =>
	//							createKey.mutateAsync(
	//								{ data: values },
	//								{
	//									onSuccess: () => {
	//										setOpen(false);
	//									},
	//								},
	//							)
	//						}
	//					/>
	//				</DialogContent>
	//			</Dialog>
	//		</PageHeader>
	//		<DataTable
	//			data={keys.map((key) => ({
	//				...key,
	//				createdAt: new Date(key.createdAt),
	//				updatedAt: new Date(key.updatedAt),
	//			}))}
	//			columns={columns}
	//			search={search}
	//			onSearchChange={(search) => {
	//				navigate({
	//					search: (p) => ({
	//						...p,
	//						...search,
	//					}),
	//				});
	//			}}
	//		/>
	//	</Page>
	//);
}
