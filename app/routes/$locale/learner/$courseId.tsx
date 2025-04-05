import { FloatingPage, PageHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { getLearnerFn } from "@/server/handlers/learners";
import { getMyCoursesFn } from "@/server/handlers/user";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Container } from "lucide-react";

export const Route = createFileRoute("/$locale/learner/$courseId")({
	component: RouteComponent,
	loader: ({ params }) => getMyCoursesFn(),
});

function RouteComponent() {
	const params = Route.useParams();
	const t = useTranslations("Learner");
	const locale = useLocale();
	const [courses] = Route.useLoaderData();

	const teams = [
		{
			name: "CompanionLink",
		},
		{
			name: "Krak",
		},
	];

	return null;

	//return (
	//	<FloatingPage>
	//		<div className="flex flex-col gap-8 w-full">
	//			<div className="flex gap-4 items-center">
	//				<img
	//					src="/favicon.ico"
	//					alt="favicon"
	//					className="w-10 h-10"
	//				/>
	//				<p>
	//					Created by <strong>{course.team.name}</strong>
	//				</p>
	//			</div>
	//			<PageHeader
	//				title={course.name}
	//				description={course.description}
	//			/>
	//			<div className="flex flex-col gap-4">
	//				<h3>Stats</h3>
	//				<Table>
	//					<TableHeader>
	//						<TableRow>
	//							<TableHead>Status</TableHead>
	//							<TableHead>Score</TableHead>
	//							<TableHead>Started At</TableHead>
	//							<TableHead>Completed At</TableHead>
	//						</TableRow>
	//					</TableHeader>
	//					<TableBody>
	//						<TableRow>
	//							<TableCell>
	//								{t.statuses[learner.status]}
	//							</TableCell>
	//							<TableCell>
	//								{learner.score.raw +
	//									" / " +
	//									learner.score.max}
	//							</TableCell>
	//							<TableCell>
	//								{formatDate({
	//									date: new Date(learner.startedAt),
	//									locale,
	//									type: "detailed",
	//								})}
	//							</TableCell>
	//							<TableCell>
	//								{formatDate({
	//									date: new Date(learner.completedAt),
	//									locale,
	//									type: "detailed",
	//								})}
	//							</TableCell>
	//						</TableRow>
	//					</TableBody>
	//				</Table>
	//			</div>
	//			<div className="flex flex-col gap-4">
	//				<h3>Collections</h3>
	//				<div className="flex flex-row gap-4">
	//					{teams.map(({ name }) => (
	//						<div
	//							key={name}
	//							className="p-4 gap-4 flex-col flex border rounded-lg flex-1"
	//						>
	//							<Container />
	//							<p className="font-medium">{name}</p>
	//							<div className="flex gap-1 items-center">
	//								{Array.from({ length: 5 }).map((_, i) => (
	//									<div
	//										className={cn(
	//											"rounded-full h-2 flex-1 bg-secondary",
	//											name.length % 2 &&
	//												"bg-green-300",
	//										)}
	//									/>
	//								))}
	//							</div>
	//						</div>
	//					))}
	//				</div>
	//			</div>
	//			<div className="flex flex-col gap-4">
	//				<h3>Teams Recognized</h3>
	//				<div className="flex flex-row gap-4">
	//					{teams.map(({ name }) => (
	//						<div
	//							key={name}
	//							className="p-4 gap-4 flex-col flex border rounded-lg flex-1"
	//						>
	//							<img
	//								src="/favicon.ico"
	//								alt="favicon"
	//								className="w-8 h-8"
	//							/>
	//							<p className="font-medium">{name}</p>
	//							<Button variant="secondary">
	//								Download Certificate
	//							</Button>
	//						</div>
	//					))}
	//				</div>
	//			</div>
	//		</div>
	//	</FloatingPage>
	//);
}
