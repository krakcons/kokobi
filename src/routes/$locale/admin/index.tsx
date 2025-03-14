import { Page, PageHeader } from "@/components/Page";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { queryOptions } from "@/lib/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/$locale/admin/")({
	component: RouteComponent,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(queryOptions.courses.all);
		await queryClient.ensureQueryData(queryOptions.collections.all);
		await queryClient.ensureQueryData(queryOptions.team.stats);
	},
});

function RouteComponent() {
	const { data: courses } = useSuspenseQuery(queryOptions.courses.all);
	const { data: collections } = useSuspenseQuery(
		queryOptions.collections.all,
	);
	const { data: stats } = useSuspenseQuery(queryOptions.team.stats);

	return (
		<Page>
			<PageHeader
				title="Dashboard"
				description="Welcome to the kokobi dashboard. Within this admin portal you will be able to create and manage courses, invite learners, and more."
			/>
			<h3>Courses</h3>
			{courses.length > 0 ? (
				courses.map((c) => (
					<Link
						from="/$locale/admin/"
						to="/$locale/admin/courses/$id/learners"
						params={(p) => ({ ...p, id: c.id })}
					>
						<Card className="flex justify-between items-center">
							<CardHeader>
								<CardTitle>{c.name}</CardTitle>
								{c.description && (
									<CardDescription>
										{c.description}
									</CardDescription>
								)}
							</CardHeader>
							<ChevronRight className="mr-2 size-6 min-w-6" />
						</Card>
					</Link>
				))
			) : (
				<Link from="/$locale/admin/" to="/$locale/admin/courses/create">
					<Card className="flex justify-between items-center">
						<CardHeader>
							<CardTitle>Create your first course</CardTitle>
							<CardDescription>
								Courses allow you to share learning materials
								according to the Scorm 1.2 and 2004 standards
							</CardDescription>
						</CardHeader>
						<ChevronRight className="mr-2 size-6 min-w-6" />
					</Card>
				</Link>
			)}
			<h3>Collections</h3>
			{collections.length > 0 ? (
				collections.map((c) => (
					<Link
						from="/$locale/admin/"
						to="/$locale/admin/collections/$id/learners"
						params={(p) => ({ ...p, id: c.id })}
					>
						<Card className="flex justify-between items-center">
							<CardHeader>
								<CardTitle>{c.name}</CardTitle>
								{c.description && (
									<CardDescription>
										{c.description}
									</CardDescription>
								)}
							</CardHeader>
							<ChevronRight className="mr-2 size-6 min-w-6" />
						</Card>
					</Link>
				))
			) : (
				<Link
					from="/$locale/admin/"
					to="/$locale/admin/collections/create"
				>
					<Card className="flex justify-between items-center">
						<CardHeader>
							<CardTitle>Create your first collection</CardTitle>
							<CardDescription>
								Collections are a way to organize a list of
								courses.
							</CardDescription>
						</CardHeader>
						<ChevronRight className="mr-2 size-6 min-w-6" />
					</Card>
				</Link>
			)}
			<h3>Quick Stats</h3>
			<Card>
				<CardHeader>
					<CardTitle>Learners</CardTitle>
					<CardDescription>{stats.learnerCount}</CardDescription>
				</CardHeader>
			</Card>
		</Page>
	);
}
