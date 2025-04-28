import { Page, PageHeader } from "@/components/Page";
import { getCourseStatisticsFn } from "@/server/handlers/courses";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CheckCircle, CircleEllipsis, Clock, Users } from "lucide-react";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { learnerStatuses } from "@/types/learner";
import { useTranslations } from "@/lib/locale";
import { getTeamConnectionsFn } from "@/server/handlers/connections";
import { useAppForm } from "@/components/ui/form";
import { z } from "zod";

export const Route = createFileRoute(
	"/$locale/admin/courses/$courseId/statistics",
)({
	validateSearch: z.object({
		teamId: z.string().optional(),
	}),
	component: RouteComponent,
	loaderDeps: ({ search }) => ({ teamId: search.teamId }),
	loader: ({ params, deps }) =>
		Promise.all([
			getCourseStatisticsFn({
				data: {
					courseId: params.courseId,
					teamId: deps.teamId === "all" ? undefined : deps.teamId,
				},
			}),
			getTeamConnectionsFn({
				data: {
					id: params.courseId,
					type: "from-team",
				},
			}),
		]),
});

const statusChartConfig: ChartConfig = {
	completed: { label: "Completed", color: "#feff5c" },
	passed: { label: "Passed", color: "#c0ff33" },
	failed: { label: "Failed", color: "--destructive" },
	"in-progress": { label: "In Progress", color: "#ffc163" },
	"not-started": { label: "Not Started", color: "--secondary" },
};

function RouteComponent() {
	const [statistics, connections] = Route.useLoaderData();
	const { teamId = "all" } = Route.useSearch();
	const navigate = Route.useNavigate();
	const t = useTranslations("Learner");

	const cards = [
		{
			title: "Total Attempts",
			value: statistics.total,
			description: "Total learners that have started this course.",
			icon: <Users className="size-4" />,
		},
		{
			title: "Total Completed",
			value: `${statistics.completed} ${statistics.completedPercent ? `(${statistics.completedPercent}%)` : ""}`,
			description: "Total learners that have completed this course.",
			icon: <CheckCircle className="size-4" />,
		},
		{
			title: "Average Completion Time",
			value: `${statistics.completedTimeAverage ?? 0} minutes`,
			description: "Average time it takes to complete this course.",
			icon: <Clock className="size-4" />,
		},
	];

	const charts = [
		{
			title: "Attempt Status",
			description: `Total learners with each status (${learnerStatuses.map((s) => t.statuses[s]).join(", ")})`,
			icon: <CircleEllipsis className="size-4" />,
			config: statusChartConfig,
			data: statistics.charts.status,
		},
	];

	const form = useAppForm({
		defaultValues: {
			teamId,
		},
	});

	return (
		<Page>
			<PageHeader
				title="Statistics"
				description="View statistics for this course."
			>
				<form.AppForm>
					<form
						onSubmit={(e) => e.preventDefault()}
						className="flex flex-col gap-8 items-start"
					>
						<form.AppField
							name="teamId"
							validators={{
								onChange: ({ value }) => {
									navigate({
										search: (prev) => ({
											...prev,
											teamId: value,
										}),
									});
								},
							}}
						>
							{(field) => (
								<field.SelectField
									label="Filter by Team"
									options={[
										{ label: "All Teams", value: "all" },
										...connections?.map((c) => ({
											label: c.team.name,
											value: c.team.id,
										})),
									]}
								/>
							)}
						</form.AppField>
					</form>
				</form.AppForm>
			</PageHeader>
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
