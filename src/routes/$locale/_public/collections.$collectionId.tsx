import { Page } from "@/components/Page";
import {
	PublicCourseCard,
	PublicPageHeader,
	PublicTeamBranding,
} from "@/components/PublicPage";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/_public/collections/$collectionId",
)({
	component: RouteComponent,
	loader: ({ params, context: { queryClient } }) => {
		return Promise.all([
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

function RouteComponent() {
	const params = Route.useParams();
	const t = useTranslations("Public");

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
			<div className="pl-24 flex-col">
				<h3 className="pb-4">{t.courses}</h3>
				{courses.map((course) => (
					<PublicCourseCard
						key={course.id}
						{...course}
						type="course"
					/>
				))}
			</div>
		</Page>
	);
}
