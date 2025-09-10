import { ContentBranding } from "@/components/ContentBranding";
import { PublicPage, PublicPageHeader } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/_public/courses/$courseId/")({
	component: RouteComponent,
	loader: async ({
		params,
		context: { queryClient, publicOrganizationId },
	}) => {
		const promises: Promise<any>[] = [
			queryClient.ensureQueryData(
				orpc.course.id.queryOptions({
					input: {
						id: params.courseId,
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
							type: "course",
							id: params.courseId,
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
	const { publicOrganizationId } = Route.useRouteContext();

	const { data: customDeliveryOrganization } = useQuery(
		orpc.organization.id.queryOptions({
			input: { id: publicOrganizationId! },
			enabled: !!publicOrganizationId,
		}),
	);

	const { data: course } = useSuspenseQuery(
		orpc.course.id.queryOptions({
			input: {
				id: params.courseId,
			},
		}),
	);
	const t = useTranslations("Course");

	const deliveryOrganization =
		customDeliveryOrganization ?? course.organization;

	return (
		<PublicPage>
			<PublicPageHeader
				title={course.name}
				description={course.description}
				organization={deliveryOrganization}
			>
				<ContentBranding
					contentOrganization={course.organization}
					connectOrganization={deliveryOrganization}
				/>
			</PublicPageHeader>
			<div>
				<Link
					id={course.id}
					to="/$locale/learner/courses/$courseId"
					search={{ organizationId: deliveryOrganization.id }}
					from={Route.fullPath}
					className={buttonVariants()}
				>
					{t.view}
				</Link>
			</div>
		</PublicPage>
	);
}
