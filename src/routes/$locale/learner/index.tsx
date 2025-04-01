import { FloatingPage, PageHeader } from "@/components/Page";
import { Badge } from "@/components/ui/badge";
import { env } from "@/env";
import { queryOptions } from "@/lib/api";
import { useTranslations } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Container } from "lucide-react";

export const Route = createFileRoute("/$locale/learner/")({
	component: RouteComponent,
	beforeLoad: async ({ context: { queryClient } }) => {
		const { user } = await queryClient.ensureQueryData(
			queryOptions.user.me,
		);

		if (!user) {
			throw redirect({
				href: env.VITE_API_URL + "/api/auth/google",
			});
		}

		await queryClient.ensureQueryData(queryOptions.user.learners);
	},
});

function RouteComponent() {
	const { data: learners } = useSuspenseQuery(queryOptions.user.learners);
	const t = useTranslations("Learner");

	const teams = [
		{
			name: "CompanionLink",
		},
		{
			name: "Krak",
		},
	];

	return (
		<FloatingPage>
			<div className="flex flex-col gap-8 w-full">
				<PageHeader
					title="Learner Dashboard"
					description="View all your progress, collections, teams, and certificates"
				/>
				<div className="flex flex-col gap-4">
					<h3>Courses</h3>
					{learners?.map(({ course, learner }) => (
						<Link
							key={learner.id}
							to="/$locale/learner/$learnerId"
							from={Route.fullPath}
							params={{
								learnerId: learner.id,
							}}
							className="w-full rounded-lg p-4 border flex flex-col gap-4"
						>
							<Badge>{t.statuses[learner.status]}</Badge>
							<p className="text-2xl font-bold">{course.name}</p>
							{course.description && <p>{course.description}</p>}
						</Link>
					))}
				</div>
				<div className="flex flex-col gap-4">
					<h3>Collections</h3>
					<div className="flex flex-row gap-4">
						{teams.map(({ name }) => (
							<div
								key={name}
								className="p-4 gap-4 flex-col flex border rounded-lg flex-1"
							>
								<Container />
								<p className="font-medium">{name}</p>
								<div className="flex gap-1 items-center">
									{Array.from({ length: 5 }).map((_, i) => (
										<div
											key={i}
											className={cn(
												"rounded-full h-2 flex-1 bg-secondary",
												name.length % 2 &&
													"bg-green-300",
											)}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</FloatingPage>
	);
}
