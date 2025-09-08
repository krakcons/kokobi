import { ContentBranding } from "@/components/ContentBranding";
import { PublicPageHeader } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/$locale/_public/courses/$courseId/")({
	component: RouteComponent,
	validateSearch: z.object({
		organizationId: z.string().optional(),
	}),
	loaderDeps: ({ search }) => ({ organizationId: search.organizationId }),
	loader: ({ params, context: { queryClient }, deps }) => {
		const promises: Promise<any>[] = [
			queryClient.ensureQueryData(
				orpc.course.id.queryOptions({
					input: {
						id: params.courseId,
					},
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

	const { data: customDeliveryOrganization } = useQuery(
		orpc.organization.id.queryOptions({
			input: { id: search.organizationId! },
			enabled: !!search.organizationId,
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
		<div className="mt-4">
			<PublicPageHeader
				title={course.name}
				description={course.description}
				organization={deliveryOrganization}
			>
				<div className="flex flex-col gap-4">
					<ContentBranding
						contentOrganization={course.organization}
						connectOrganization={deliveryOrganization}
					/>
				</div>
			</PublicPageHeader>
			<div className="pl-24">
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
		</div>
	);
}
