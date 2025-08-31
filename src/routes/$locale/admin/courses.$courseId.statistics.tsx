import { Page, PageHeader } from "@/components/Page";
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
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { useTranslations } from "@/lib/locale";
import { useAppForm } from "@/components/ui/form";
import { z } from "zod";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import ExportCSVButton from "@/components/ExportCSVButton";
import { orpc } from "@/server/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute(
	"/$locale/admin/courses/$courseId/statistics",
)({
	validateSearch: z.object({
		statsTeamId: z.string().optional(),
	}),
	component: RouteComponent,
	loaderDeps: ({ search }) => ({ statsTeamId: search.statsTeamId }),
	loader: ({ params, deps, context: { queryClient } }) =>
		Promise.all([
			getUserTeamFn({
				data: {
					type: "admin",
				},
			}),
			queryClient.ensureQueryData(
				orpc.course.statistics.queryOptions({
					input: {
						id: params.courseId,
						teamId: deps.statsTeamId,
					},
				}),
			),
			queryClient.ensureQueryData(
				orpc.course.sharedTeams.queryOptions({
					input: {
						id: params.courseId,
					},
				}),
			),
		]),
});

function RouteComponent() {
	const [team] = Route.useLoaderData();
	const { statsTeamId = "all" } = Route.useSearch();
	const params = Route.useParams();

	const { data: statistics } = useSuspenseQuery(
		orpc.course.statistics.queryOptions({
			input: {
				id: params.courseId,
				teamId: statsTeamId,
			},
		}),
	);

	const { data: teams } = useSuspenseQuery(
		orpc.course.sharedTeams.queryOptions({
			input: {
				id: params.courseId,
			},
		}),
	);

	const navigate = Route.useNavigate();
	const t = useTranslations("Statistics");
	const tLearner = useTranslations("Learner");

	const statusChartConfig: ChartConfig = {
		completed: { label: tLearner.statuses.completed, color: "#feff5c" },
		passed: { label: tLearner.statuses.passed, color: "#c0ff33" },
		failed: {
			label: tLearner.statuses.failed,
			color: "var(--destructive)",
		},
		"in-progress": {
			label: tLearner.statuses["in-progress"],
			color: "#ffc163",
		},
		"not-started": {
			label: tLearner.statuses["not-started"],
			color: "var(--secondary)",
		},
	};

	const cards = [
		{
			title: t.totalAttempts.title,
			value: statistics.total,
			description: t.totalAttempts.description,
			icon: <Users className="size-4" />,
		},
		{
			title: t.totalCompletions.title,
			value: `${statistics.completed} ${statistics.completedPercent ? `(${statistics.completedPercent}%)` : ""}`,
			description: t.totalCompletions.description,
			icon: <CheckCircle className="size-4" />,
		},
		{
			title: t.averageCompletionTime.title,
			value: `${statistics.completedTimeAverage ?? 0} ${t.averageCompletionTime.minutes}`,
			description: t.averageCompletionTime.description,
			icon: <Clock className="size-4" />,
		},
	];

	const charts = [
		{
			title: t.attemptStatus.title,
			description: `${t.attemptStatus.description}`,
			icon: <CircleEllipsis className="size-4" />,
			config: statusChartConfig,
			data: statistics.charts.status,
		},
	];

	const form = useAppForm({
		defaultValues: {
			statsTeamId,
		},
		validators: {
			onChange: ({ value }) => {
				navigate({
					search: (prev) => ({
						...prev,
						statsTeamId:
							value.statsTeamId === "all"
								? undefined
								: value.statsTeamId,
					}),
				});
			},
		},
	});

	const statExport: Record<string, string | number> = {};
	cards.forEach((stat) => {
		statExport[stat.title] = stat.value;
	});
	charts.forEach((chart) => {
		chart.data.forEach((stat) => {
			statExport[chart.title + " (" + stat.name + ")"] = stat.value;
		});
	});

	return (
		<Page>
			<PageHeader title={t.title} description={t.description}>
				<div className="flex items-end gap-2">
					<ExportCSVButton data={[statExport]} filename="stats" />
					{teams && teams.length > 0 && (
						<form.AppForm>
							<form
								onSubmit={(e) => e.preventDefault()}
								className="flex flex-col gap-8 items-start"
							>
								<form.AppField name="statsTeamId">
									{(field) => (
										<field.SelectField
											label={t.filter.title}
											options={[
												{
													label: t.filter.all,
													value: "all",
												},
												{
													label: team.name,
													value: team?.id,
												},
												...teams.map((c) => ({
													label: c.name,
													value: c.id,
												})),
											]}
										/>
									)}
								</form.AppField>
							</form>
						</form.AppForm>
					)}
				</div>
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
									<ChartLegend
										content={<ChartLegendContent />}
										className="-ml-1 justify-start flex-wrap gap-2"
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
