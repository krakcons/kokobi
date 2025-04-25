import { ConnectionComponent } from "@/components/ConnectionComponent";
import { Page, PageHeader } from "@/components/Page";
import { useTranslations } from "@/lib/locale";
import { getConnectionsFn } from "@/server/handlers/connections";
import { getAvailableCoursesFn } from "@/server/handlers/courses";
import { createFileRoute } from "@tanstack/react-router";

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
				{courses?.map((connection) => (
					<ConnectionComponent
						key={connection.course!.id}
						{...connection.course!}
						type="course"
						connection={connection}
					/>
				))}
			</div>
			<div className="flex flex-col gap-4">
				<h3>{tNav.collections}</h3>
				{collections?.map((connection) => (
					<ConnectionComponent
						key={connection.collection!.id}
						{...connection.collection!}
						type="collection"
						connection={connection}
					/>
				))}
			</div>
		</Page>
	);
}
