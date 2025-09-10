import { ContentBranding } from "@/components/ContentBranding";
import {
	PublicCourseCard,
	PublicPage,
	PublicPageHeader,
} from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/_public/collections/$collectionId",
)({
	component: RouteComponent,
	loader: async ({
		params,
		context: { queryClient, publicOrganizationId },
	}) => {
		const promises: Promise<any>[] = [
			queryClient.ensureQueryData(
				orpc.collection.id.queryOptions({
					input: {
						id: params.collectionId,
					},
				}),
			),
		];

		if (publicOrganizationId) {
			// Check for delivering organization access
			promises.push(
				queryClient.ensureQueryData(
					orpc.organization.access.queryOptions({
						input: {
							organizationId: publicOrganizationId,
							type: "collection",
							id: params.collectionId,
						},
					}),
				),
			);
			// Preload delivering organization
			promises.push(
				queryClient.ensureQueryData(
					orpc.organization.id.queryOptions({
						input: { id: publicOrganizationId },
					}),
				),
			);
		}

		return Promise.all(promises);
	},
});

function RouteComponent() {
	const params = Route.useParams();
	const t = useTranslations("Public");
	const s = useTranslations("Collection");
	const { publicOrganizationId } = Route.useRouteContext();

	const { data: customDeliveryOrganization } = useQuery(
		orpc.organization.id.queryOptions({
			input: { id: publicOrganizationId! },
			enabled: !!publicOrganizationId,
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
		<PublicPage>
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

			<div className="flex-col">
				<Link
					id={collection.id}
					to="/$locale/learner/collections/$collectionId"
					search={{ organizationId: deliveryOrganization.id }}
					from={Route.fullPath}
					className={buttonVariants()}
				>
					{s.view}
				</Link>

				<h3 className="py-6">{t.courses}</h3>
				{courses.map((course) => (
					<PublicCourseCard
						key={course.id}
						{...course}
						type="course"
					/>
				))}
			</div>
		</PublicPage>
	);
}
