import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	createDataTableActionsColumn,
	DataTable,
	DataTableColumnHeader,
	TableSearchSchema,
} from "@/components/DataTable";
import { Page, PageHeader } from "@/components/Page";
import { Learner } from "@/types/learner";
import { Module } from "@/types/module";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { locales, useLocale, useTranslations } from "@/lib/locale";
import { formatDate } from "@/lib/date";
import { useState } from "react";
import { LearnersForm } from "@/components/forms/LearnersForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import {
	deleteLearnerFn,
	getLearnersFn,
	inviteLearnersToCourseFn,
} from "@/server/handlers/learners";
import { getTeamFn } from "@/server/handlers/teams";
import { createCourseLink } from "@/lib/invite";
import { User } from "@/types/users";
import { UserToCourseType } from "@/types/connections";

export const Route = createFileRoute("/$locale/admin/courses/$id/learners")({
	component: RouteComponent,
	validateSearch: TableSearchSchema,
	loader: ({ params }) => {
		return Promise.all([
			getLearnersFn({
				data: {
					id: params.id,
				},
			}),
			getTeamFn(),
		]);
	},
});

function RouteComponent() {
	const [open, setOpen] = useState(false);
	const navigate = Route.useNavigate();
	const params = Route.useParams();
	const search = Route.useSearch();
	const t = useTranslations("Learner");
	const locale = useLocale();
	const [learners, team] = Route.useLoaderData();
	const router = useRouter();

	console.log("LEARNERS", learners);

	const inviteLearners = useMutation({
		mutationFn: inviteLearnersToCourseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const deleteLearner = useMutation({
		mutationFn: deleteLearnerFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	const columns: ColumnDef<UserToCourseType & { user: User }>[] = [
		{
			accessorKey: "user.firstName",
			header: ({ column }) => (
				<DataTableColumnHeader title="First Name" column={column} />
			),
		},
		{
			accessorKey: "user.lastName",
			header: ({ column }) => (
				<DataTableColumnHeader title="Last Name" column={column} />
			),
		},
		{
			accessorKey: "user.email",
			header: ({ column }) => (
				<DataTableColumnHeader title="Email" column={column} />
			),
		},
		{
			accessorKey: "connectStatus",
			accessorFn: ({ connectStatus }) =>
				connectStatus.slice(0, 1).toUpperCase() +
				connectStatus.slice(1),
			header: ({ column }) => (
				<DataTableColumnHeader title="Status" column={column} />
			),
		},
		//{
		//	accessorKey: "startedAt",
		//	accessorFn: ({ startedAt }) =>
		//		formatDate({ date: startedAt, locale, type: "detailed" }),
		//	header: ({ column }) => (
		//		<DataTableColumnHeader title="Started At" column={column} />
		//	),
		//},
		//{
		//	accessorKey: "completedAt",
		//	accessorFn: ({ completedAt }) =>
		//		formatDate({ date: completedAt, locale, type: "detailed" }),
		//	header: ({ column }) => (
		//		<DataTableColumnHeader title="Completed At" column={column} />
		//	),
		//},
		//{
		//	accessorKey: "status",
		//	accessorFn: ({ status }) => t.statuses[status],
		//	header: ({ column }) => (
		//		<DataTableColumnHeader title="Status" column={column} />
		//	),
		//},
		//{
		//	accessorKey: "module.locale",
		//	accessorFn: ({ module }) =>
		//		locales.find((l) => l.value === module?.locale)?.label,
		//	header: ({ column }) => (
		//		<DataTableColumnHeader title="Locale" column={column} />
		//	),
		//},
		//{
		//	accessorKey: "module.versionNumber",
		//	header: ({ column }) => (
		//		<DataTableColumnHeader title="Version" column={column} />
		//	),
		//},
		//{
		//	accessorKey: "score",
		//	accessorFn: ({ score }) => {
		//		if (score && score.raw && score.max) {
		//			return `${score.raw} / ${score.max}`;
		//		}
		//	},
		//	header: ({ column }) => (
		//		<DataTableColumnHeader title="Score" column={column} />
		//	),
		//},
		createDataTableActionsColumn<
			Learner & { module: Module | null; joinLink?: string }
		>([
			{
				name: "Delete",
				onClick: ({ id }) =>
					deleteLearner.mutate({
						data: {
							courseId: params.id,
							learnerId: id,
						},
					}),
			},
		]),
	];

	const inviteLink = createCourseLink({
		domain: team.domains.length > 0 ? team.domains[0] : undefined,
		courseId: params.id,
	});

	return (
		<Page>
			<PageHeader
				title="Learners"
				description="Manage learners for this course."
			>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus />
							Create
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-3xl w-full">
						<DialogHeader>
							<DialogTitle>Invite Learners</DialogTitle>
							<DialogDescription>
								Enter learners below to invite them to the
								course.
							</DialogDescription>
						</DialogHeader>
						<LearnersForm
							onSubmit={(value) =>
								inviteLearners.mutateAsync(
									{
										data: {
											...value,
											courseId: params.id,
										},
									},
									{
										onSuccess: () => setOpen(false),
									},
								)
							}
						/>
					</DialogContent>
				</Dialog>
			</PageHeader>
			<div className="bg-secondary rounded flex gap-2 items-center px-3 py-2 overflow-x-auto">
				<p className="truncate text-sm text-muted-foreground">
					{inviteLink}
				</p>
				<CopyButton text={inviteLink} />
			</div>
			<DataTable
				data={learners}
				columns={columns}
				search={search}
				onSearchChange={(search) => {
					navigate({
						search: (prev) => ({
							...prev,
							...search,
						}),
					});
				}}
			/>
		</Page>
	);
}
