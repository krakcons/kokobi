import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { useTranslations } from "@/lib/locale";
import {
	createTeamUsersFn,
	deleteTeamUserFn,
	getTeamUsersFn,
	updateTeamUserFn,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import { Role, roles } from "@/types/team";
import { SelectValue } from "@radix-ui/react-select";

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
	const t = useTranslations("Members");
	const tForm = useTranslations("MembersForm");
	const tRole = useTranslations("TeamRole");
	const tActions = useTranslations("Actions");
	const router = useRouter();

	const createTeamUsers = useMutation({
		mutationFn: createTeamUsersFn,
		onSuccess: () => {
			setOpen(false);
			router.invalidate();
		},
	});
	const updateTeamUser = useMutation({
		mutationFn: updateTeamUserFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const deleteTeamUser = useMutation({
		mutationFn: deleteTeamUserFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	const columns: ColumnDef<UserToTeamType & { user: User }>[] = [
		{
			accessorKey: "user.email",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t.table.email} />
			),
		},
		{
			accessorKey: "connectStatus",
			header: ({ column }) => (
				<DataTableColumnHeader title={t.table.status} column={column} />
			),
			cell: ({ row: { original } }) => {
				return <ConnectionStatusBadge {...original} />;
			},
		},
		{
			accessorKey: "role",
			accessorFn: ({ role }) => tRole[role],
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={t.table.role} />
			),
			cell: ({
				row: {
					original: { userId, role },
				},
			}) => {
				return (
					<Select
						value={role}
						onValueChange={(value: Role) => {
							updateTeamUser.mutate({
								data: {
									userId: userId,
									role: value,
								},
							});
						}}
					>
						<SelectTrigger className="w-min">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{roles.map((role) => (
								<SelectItem key={role} value={role}>
									{tRole[role]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);
			},
		},
		createDataTableActionsColumn<UserToTeamType & { user: User }>([
			// TODO: Needs join team page
			//{
			//	name: "Resend Invite",
			//	onClick: ({ user, role }) =>
			//		createTeamUsers.mutate({
			//			data: {
			//				users: [
			//					{
			//						email: user.email,
			//						role,
			//					},
			//				],
			//			},
			//		}),
			//},
			{
				name: tActions.delete,
				onClick: ({ userId }) => {
					deleteTeamUser.mutate({
						data: {
							userId: userId,
						},
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
							<UserPlus />
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
