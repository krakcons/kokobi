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

export const Route = createFileRoute("/$locale/admin/")({
	component: RouteComponent,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(queryOptions.courses.all);
		await queryClient.ensureQueryData(queryOptions.team.stats);
	},
});

function RouteComponent() {
	const { data: courses } = useSuspenseQuery(queryOptions.courses.all);
	const { data: stats } = useSuspenseQuery(queryOptions.team.stats);

	return (
		<Page>
			<PageHeader
				title="Dashboard"
				description="Welcome to the kokobi dashboard. Within this admin portal you will be able to create and manage courses, invite learners, and more."
			/>
			<h3>Courses</h3>
			{courses.map((c) => (
				<Link
					from="/$locale/admin/"
					to="/$locale/admin/courses/$id/learners"
					params={(p) => ({ ...p, id: c.id })}
				>
					<Card>
						<CardHeader>
							<CardTitle>{c.name}</CardTitle>
							<CardDescription>{c.description}</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			))}
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
