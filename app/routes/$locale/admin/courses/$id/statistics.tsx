import { Page, PageHeader } from "@/components/Page";
import { getCourseStatisticsFn } from "@/server/handlers/courses";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	CheckCircle,
	CircleEllipsis,
	Clock,
	TrendingUpIcon,
	Users,
} from "lucide-react";
import { Learner, learnerStatuses } from "@/types/learner";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { completionStatuses } from "@/types/course";

export const Route = createFileRoute("/$locale/admin/courses/$id/statistics")({
	component: RouteComponent,
	loader: ({ params }) => {
		return Promise.all([
			getCourseStatisticsFn({
				data: {
					courseId: params.id,
				},
			}),
		]);
	},
});

const statusChartConfig: ChartConfig = {
	completed: { label: "Completed", color: "#feff5c" },
	passed: { label: "Passed", color: "#c0ff33" },
	failed: { label: "Failed", color: "--destructive" },
	"in-progress": { label: "In Progress", color: "#ffc163" },
	"not-started": { label: "Not Started", color: "--secondary" },
};

function RouteComponent() {
	const [statistics] = Route.useLoaderData();
	const learners = statistics.learners.length;
	const completed = statistics.learners.filter((l) => !!l.completedAt).length;
	const totalCompletionTime = statistics.learners.reduce((acc, learner) => {
		if (learner.completedAt) {
			acc +=
				(learner.completedAt.getTime() - learner.createdAt.getTime()) /
				1000;
		}
		return acc;
	}, 0);

	const cards = [
		{
			title: "Total Learners",
			value: learners,
			description: "Total learners that have enrolled in this course.",
			icon: <Users className="size-4" />,
		},
		{
			title: "Total Completed",
			value: `${completed} (${Math.round(
				(completed / learners) * 100,
			)}%)`,
			description: "Total learners that have completed this course.",
			icon: <CheckCircle className="size-4" />,
		},
		{
			title: "Average Completion Time",
			value: `${Math.round(totalCompletionTime / 60 / completed)} minutes`,
			description: "Average time it takes to complete this course.",
			icon: <Clock className="size-4" />,
		},
	];

	const charts = [
		{
			title: "Learner Status",
			description: "Portion of learners with each status.",
			icon: <CircleEllipsis className="size-4" />,
			config: statusChartConfig,
			data: statistics.learners.reduce(
				(acc, learner) => {
					const index = learnerStatuses.indexOf(learner.status);
					if (index !== -1) {
						acc[index].value += 1;
					}
					return acc;
				},
				learnerStatuses.map((status) => ({ name: status, value: 0 })),
			),
		},
	];

	return (
		<Page>
			<PageHeader
				title="Statistics"
				description="View statistics for this course."
			/>
			<div className="flex gap-4 flex-wrap items-start">
				{cards.map((card) => (
					<Card
						className="@container/card flex-1 min-w-xs"
						key={card.title}
					>
						<CardHeader className="relative">
							<CardDescription className="flex items-center justify-between gap-2">
								{card.title}
								{card.icon}
							</CardDescription>
							<CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
								{card.value}
							</CardTitle>
						</CardHeader>
						<CardFooter className="flex-col items-start gap-1 text-sm">
							<div className="text-muted-foreground">
								{card.description}
							</div>
						</CardFooter>
					</Card>
				))}
				{charts.map((chart) => (
					<Card
						className="@container/card flex-1 min-w-xs"
						key={chart.title}
					>
						<CardHeader className="relative">
							<CardDescription className="flex items-center justify-between gap-2">
								{chart.title}
								{chart.icon}
							</CardDescription>
						</CardHeader>
						<CardContent className="flex-1 pb-0">
							<ChartContainer config={statusChartConfig}>
								<PieChart accessibilityLayer>
									<ChartTooltip
										cursor={false}
										content={
											<ChartTooltipContent hideLabel />
										}
									/>
									<Pie
										data={chart.data.map((d) => ({
											...d,
											fill: `var(--color-${d.name})`,
										}))}
										nameKey="name"
										dataKey="value"
									/>
								</PieChart>
							</ChartContainer>
						</CardContent>
						<CardFooter className="flex-col items-start gap-1 text-sm">
							<div className="text-muted-foreground">
								{chart.description}
							</div>
						</CardFooter>
					</Card>
				))}
			</div>
		</Page>
	);
}
