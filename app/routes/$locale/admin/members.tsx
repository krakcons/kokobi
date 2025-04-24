import {
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { useLocale, useTranslations } from "@/lib/locale";
import {
	createTeamUsersFn,
	getTeamUsersFn,
} from "@/server/handlers/teams.users";
import { User } from "@/types/users";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { TeamUsersForm } from "@/components/forms/TeamUsersForm";
import { UserToTeamType } from "@/types/connections";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";

export const Route = createFileRoute("/$locale/admin/members")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: () => getTeamUsersFn(),
});

function RouteComponent() {
	const [open, setOpen] = useState(false);
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const members = Route.useLoaderData();
	const t = useTranslations("Role");
	const router = useRouter();

	const createTeamUsers = useMutation({
		mutationFn: createTeamUsersFn,
		onSuccess: () => {
			setOpen(false);
			router.invalidate();
		},
	});

	const columns: ColumnDef<UserToTeamType & { user: User }>[] = [
		{
			accessorKey: "user.email",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Name" />
			),
		},
		{
			accessorKey: "connectStatus",
			header: ({ column }) => (
				<DataTableColumnHeader title="Status" column={column} />
			),
			cell: ({ row: { original } }) => {
				return <ConnectionStatusBadge {...original} />;
			},
		},
		{
			accessorKey: "role",
			accessorFn: ({ role }) => t[role],
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Role" />
			),
		},
	];

	return (
		<Page>
			<PageHeader title="Members" description="Manage your members">
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<UserPlus />
							Invite
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Invite Members</DialogTitle>
							<DialogDescription>
								Enter the emails and roles of the members you
								want to invite.
							</DialogDescription>
						</DialogHeader>
						<TeamUsersForm
							onSubmit={(values) =>
								createTeamUsers.mutateAsync({
									data: values,
								})
							}
						/>
					</DialogContent>
				</Dialog>
			</PageHeader>
			<DataTable
				data={members}
				columns={columns}
				search={search}
				onSearchChange={(search) => {
					navigate({
						search,
					});
				}}
			/>
		</Page>
	);
}
