import { ContentBranding } from "@/components/ContentBranding";
import { Page } from "@/components/Page";
import { PublicCourseCard, PublicPageHeader } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute(
	"/$locale/_public/collections/$collectionId",
)({
	component: RouteComponent,
	validateSearch: z.object({
		organizationId: z.string().optional(),
	}),
	loaderDeps: ({ search }) => ({ organizationId: search.organizationId }),
	loader: ({ params, context: { queryClient }, deps }) => {
		const promises: Promise<any>[] = [
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
		];

		if (deps.organizationId) {
			promises.push(
				queryClient.ensureQueryData(
					orpc.organization.id.queryOptions({
						input: { id: deps.organizationId },
					}),
				),
			);
		}

		return Promise.all(promises);
	},
});

function RouteComponent() {
	const params = Route.useParams();
	const search = Route.useSearch();
	const t = useTranslations("Public");
	const s = useTranslations("Collection");

	const { data: customDeliveryOrganization } = useQuery(
		orpc.organization.id.queryOptions({
			input: { id: search.organizationId! },
			enabled: !!search.organizationId,
		}),
	);
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

	const deliveryOrganization =
		customDeliveryOrganization ?? collection.organization;

	return (
		<Page>
			<PublicPageHeader
				title={collection.name}
				description={collection.description}
				organization={deliveryOrganization}
			>
				<ContentBranding
					contentOrganization={collection.organization}
					connectOrganization={deliveryOrganization}
				/>
			</PublicPageHeader>

			<div className="pl-24 flex-col">
				<Link
					id={collection.id}
					to="/$locale/learner/collections/$collectionId"
					search={{ organizationId: deliveryOrganization.id }}
					from={Route.fullPath}
					className={buttonVariants()}
				>
					{s.view}
				</Link>

				<h3 className="pb-4 py-6">{t.courses}</h3>
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
