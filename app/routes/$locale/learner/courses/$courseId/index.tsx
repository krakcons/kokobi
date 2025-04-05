import { FloatingPage, PageHeader } from "@/components/Page";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import { useLocale, useTranslations } from "@/lib/locale";
import { getMyCourseFn } from "@/server/handlers/user";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/learner/courses/$courseId/")({
	component: RouteComponent,
	loader: async ({ params }) => {
		const course = await getMyCourseFn({
			data: {
				courseId: params.courseId,
			},
		});

		if (!course) {
			throw redirect({
				to: "/$locale/learner/courses/$courseId/request",
				params: {
					courseId: params.courseId,
				},
			});
		}

		return course;
	},
});

function RouteComponent() {
	const course = Route.useLoaderData();
	const t = useTranslations("Learner");
	const locale = useLocale();

	console.log(course);

	return (
		<FloatingPage>
			<div className="flex flex-col gap-8 w-full">
				<div className="flex gap-4 items-center">
					<img
						src="/favicon.ico"
						alt="favicon"
						className="w-10 h-10"
					/>
					<p>
						Created by <strong>{course.team.name}</strong>
					</p>
				</div>
				<PageHeader
					title={course.name}
					description={course.description}
				/>
				{course.attemps ? (
					<div className="flex flex-col gap-4">
						<h3>Attempts</h3>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Status</TableHead>
									<TableHead>Score</TableHead>
									<TableHead>Started At</TableHead>
									<TableHead>Completed At</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{course.attempts.map((attempt) => (
									<TableRow key={attempt.id}>
										<TableCell>
											{t.statuses[attempt.status]}
										</TableCell>
										<TableCell>
											{attempt.score.raw +
												" / " +
												attempt.score.max}
										</TableCell>
										<TableCell>
											{formatDate({
												date: new Date(
													attempt.startedAt,
												),
												locale,
												type: "detailed",
											})}
										</TableCell>
										<TableCell>
											{formatDate({
												date: new Date(
													attempt.completedAt,
												),
												locale,
												type: "detailed",
											})}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				) : (
					<Link
						to="/$locale/learner/courses/$courseId/play"
						params={{ courseId: course.id, locale }}
						className={buttonVariants()}
					>
						Start Course
					</Link>
				)}
			</div>
		</FloatingPage>
	);
}
