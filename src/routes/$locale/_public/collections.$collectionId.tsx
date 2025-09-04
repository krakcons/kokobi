import { ContentBranding } from "@/components/ContentBranding";
import { Page, PageHeader } from "@/components/Page";
import { PublicPageHeader, PublicTeamBranding } from "@/components/PublicPage";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useLocale } from "@/lib/locale";
import { orpc } from "@/server/client";
import { getUserTeamFn } from "@/server/handlers/users.teams";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute(
	"/$locale/_public/collections/$collectionId",
)({
	component: RouteComponent,
	loader: ({ params, context: { queryClient } }) => {
		return Promise.all([
			getUserTeamFn({
				data: {
					type: "learner",
				},
			}),
			queryClient.ensureQueryData(
				orpc.collection.id.queryOptions({
					input: { id: params.collectionId },
				}),
			),
			queryClient.ensureQueryData(
				orpc.collection.courses.get.queryOptions({
					input: { id: params.collectionId },
				}),
			),
		]);
	},
});

export const CourseCard = ({
	name,
	description,
	type,
	id,
}: {
	name: string;
	description: string;
	type: "course" | "collection";
	id: string;
}) => {
	const locale = useLocale();
	return (
		<Link
			to={
				type === "course"
					? "/$locale/courses/$courseId"
					: "/$locale/collections/$collectionId"
			}
			params={{
				locale,
				collectionId: id,
				courseId: id,
			}}
		>
			<Card className="flex flex-row justify-between items-center">
				<CardHeader className="flex-1">
					<CardTitle>{name}</CardTitle>
					{description && (
						<CardDescription>{description}</CardDescription>
					)}
				</CardHeader>
				<ChevronRight className="mr-2 size-6 min-w-6" />
			</Card>
		</Link>
	);
};

function RouteComponent() {
	const [team] = Route.useLoaderData();
	const params = Route.useParams();

	const { data: collection } = useSuspenseQuery(
		orpc.collection.id.queryOptions({
			input: { id: params.collectionId },
		}),
	);
	const { data: courses } = useSuspenseQuery(
		orpc.collection.courses.get.queryOptions({
			input: { id: params.collectionId },
		}),
	);

	return (
		<Page>
			<PublicPageHeader
				title={collection.name}
				description={collection.description}
			>
				<PublicTeamBranding contentTeam={collection.team} />
			</PublicPageHeader>
			<div className="pl-24">
				<h3>Courses</h3>
				{courses.map((course) => (
					<CourseCard key={course.id} {...course} type="course" />
				))}
			</div>
		</Page>
	);
}
