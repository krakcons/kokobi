import { ContentBranding } from "@/components/ContentBranding";
import { Page, PageHeader } from "@/components/Page";
import { Button, buttonVariants } from "@/components/ui/button";
import { useTranslations } from "@/lib/locale";
import { getUserModulesByCourseFn } from "@/server/handlers/users.modules";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import { getAuthFn } from "@/server/handlers/auth";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { orpc } from "@/server/client";
import { TeamIcon } from "@/components/TeamIcon";
import { teamImageUrl } from "@/lib/file";
import type { Team, TeamTranslation } from "@/types/team";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/$locale/_public/courses/$courseId/")({
	component: RouteComponent,
	loader: ({ params, context: { queryClient } }) => {
		return Promise.all([
			getUserTeamFn({
				data: {
					type: "learner",
				},
			}),
			getUserModulesByCourseFn({
				data: {
					courseId: params.courseId,
				},
			}),
			getAuthFn(),
			queryClient.ensureQueryData(
				orpc.connection.getOne.queryOptions({
					input: {
						senderType: "user",
						recipientType: "course",
						id: params.courseId,
					},
				}),
			),
			queryClient.ensureQueryData(
				orpc.course.id.queryOptions({
					input: {
						id: params.courseId,
					},
				}),
			),
		]);
	},
});

export const CourseHeader = ({
	title,
	description,
	UnderTitle = null,
	children,
}: {
	title: string;
	description: string;
	UnderTitle?: React.ReactNode;
	children?: React.ReactNode;
}) => (
	<div className="flex flex-col gap-2">
		<div className="flex justify-between flex-col gap-6 pl-24">
			<div className="flex flex-col gap-5">
				<h2>{title}</h2>
				{UnderTitle}
				{description && <p>{description}</p>}
			</div>
			{children}
		</div>
		<Separator className="mt-2 mb-4" />
	</div>
);

export const Branding = ({
	contentTeam,
}: {
	contentTeam: Team & TeamTranslation;
}) => (
	<div className="flex items-center gap-2">
		<TeamIcon src={teamImageUrl(contentTeam, "logo")} className="max-h-8" />
		<p className="text-muted-foreground">
			Created by <strong>{contentTeam.name}</strong>
		</p>
	</div>
);

function RouteComponent() {
	const params = Route.useParams();
	const { data: course } = useSuspenseQuery(
		orpc.course.id.queryOptions({
			input: {
				id: params.courseId,
			},
		}),
	);
	const t = useTranslations("Course");

	return (
		<div className="mt-4">
			<CourseHeader title={course.name} description={course.description}>
				<Branding contentTeam={course.team} />
			</CourseHeader>
			<div className="pl-24">
				<Link
					id={course.id}
					to="/$locale/learner/courses/$courseId"
					from={Route.fullPath}
					className={buttonVariants()}
				>
					{t.view}
				</Link>
			</div>
		</div>
	);
}
