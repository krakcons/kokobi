import { Page, PageHeader } from "@/components/Page";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { getCollectionsFn } from "@/server/handlers/collections";
import { getTeamCourseConnectionsFn } from "@/server/handlers/connections";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/$locale/admin/")({
	component: RouteComponent,
	loader: ({ context: { queryClient } }) =>
		Promise.all([
			queryClient.ensureQueryData(orpc.course.get.queryOptions()),
			getCollectionsFn(),
			getTeamCourseConnectionsFn({
				data: {
					type: "to",
				},
			}),
		]),
});

function RouteComponent() {
	const [courses, collections, connections] = Route.useLoaderData();
	const t = useTranslations("AdminDashboard");
	const tNav = useTranslations("AdminSidebar");

	const allCourses = [...courses, ...connections.map((c) => c.course)];

	return (
		<Page>
			<PageHeader title={t.title} description={t.description} />
			<h3>{tNav.courses}</h3>
			{allCourses.length > 0 ? (
				allCourses.map((c) => (
					<Link
						key={c.id}
						from="/$locale/admin/"
						to="/$locale/admin/courses/$courseId/learners"
						params={(p) => ({ ...p, courseId: c.id })}
					>
						<Card className="flex flex-row justify-between items-center">
							<CardHeader className="flex-1">
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
					<Card className="flex flex-row justify-between items-center">
						<CardHeader className="flex-1">
							<CardTitle>{t.course.title}</CardTitle>
							<CardDescription>
								{t.course.description}
							</CardDescription>
						</CardHeader>
						<ChevronRight className="mr-2 size-6 min-w-6" />
					</Card>
				</Link>
			)}
			<h3>{tNav.collections}</h3>
			{collections.length > 0 ? (
				collections.map((c) => (
					<Link
						key={c.id}
						from="/$locale/admin/"
						to="/$locale/admin/collections/$collectionId/learners"
						params={(p) => ({ ...p, collectionId: c.id })}
					>
						<Card className="flex flex-row justify-between items-center">
							<CardHeader className="flex-1">
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
					<Card className="flex flex-row justify-between items-center">
						<CardHeader className="flex-1">
							<CardTitle>{t.collection.title}</CardTitle>
							<CardDescription>
								{t.collection.description}
							</CardDescription>
						</CardHeader>
						<ChevronRight className="mr-2 size-6 min-w-6" />
					</Card>
				</Link>
			)}
		</Page>
	);
}
