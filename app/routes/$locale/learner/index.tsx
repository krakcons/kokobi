import { ConnectionComponent } from "@/components/ConnectionComponent";
import { Page, PageHeader } from "@/components/Page";
import { useTranslations } from "@/lib/locale";
import { getConnectionsFn } from "@/server/handlers/connections";
import { getAvailableCoursesFn } from "@/server/handlers/courses";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/$locale/learner/")({
	component: RouteComponent,
	loader: () =>
		Promise.all([
			getConnectionsFn({
				data: {
					type: "course",
				},
			}),
			getConnectionsFn({
				data: {
					type: "collection",
				},
			}),
			getAvailableCoursesFn(),
		]),
});

function RouteComponent() {
	const [courses, collections, allAvailableCourses] = Route.useLoaderData();
	const t = useTranslations("LearnerDashboard");
	const tNav = useTranslations("LearnerSidebar");

	const availableCourses = allAvailableCourses.filter(
		(c) => !courses?.some(({ course }) => course?.id === c.id),
	);

	return (
		<Page>
			<PageHeader title={t.title} description={t.description} />
			{availableCourses.length > 0 && (
				<div className="flex flex-col gap-4">
					<h3>{tNav["available-courses"]}</h3>
					{availableCourses.map((course) => (
						<ConnectionComponent
							key={course!.id}
							{...course}
							type="course"
							connection={{
								connectType: "invite",
								connectStatus: "accepted",
							}}
						/>
					))}
				</div>
			)}
			<div className="flex flex-col gap-4">
				<h3>{tNav.courses}</h3>
				{courses && courses.length > 0 ? (
					courses.map((connection) => (
						<ConnectionComponent
							key={connection.course!.id}
							{...connection.course!}
							type="course"
							connection={connection}
						/>
					))
				) : (
					<Card className="flex justify-between items-center">
						<CardHeader>
							<CardTitle>{t.course.title}</CardTitle>
							<CardDescription>
								{t.course.description}
							</CardDescription>
						</CardHeader>
					</Card>
				)}
			</div>
			<div className="flex flex-col gap-4">
				<h3>{tNav.collections}</h3>
				{collections && collections.length > 0 ? (
					collections.map((connection) => (
						<ConnectionComponent
							key={connection.collection!.id}
							{...connection.collection!}
							type="collection"
							connection={connection}
						/>
					))
				) : (
					<Card className="flex justify-between items-center">
						<CardHeader>
							<CardTitle>{t.collection.title}</CardTitle>
							<CardDescription>
								{t.collection.description}
							</CardDescription>
						</CardHeader>
					</Card>
				)}
			</div>
		</Page>
	);
}
