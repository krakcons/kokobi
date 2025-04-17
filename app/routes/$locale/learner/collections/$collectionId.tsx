import { Certificate } from "@/components/Certificate";
import { ConnectionComponent } from "@/components/ConnectionComponent";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { ConnectionWrapper } from "@/components/ConnectionWrapper";
import { ContentBranding } from "@/components/ContentBranding";
import { Page, PageHeader } from "@/components/Page";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import { useLocale, useTranslations } from "@/lib/locale";
import {
	getCollectionCoursesFn,
	getCollectionFn,
} from "@/server/handlers/collections";
import {
	getConnectionFn,
	requestConnectionFn,
	userConnectionResponseFn,
} from "@/server/handlers/connections";
import { getTeamFn } from "@/server/handlers/teams";
import { getAuthFn } from "@/server/handlers/user";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/$locale/learner/collections/$collectionId",
)({
	component: RouteComponent,
	loader: ({ params }) => {
		return Promise.all([
			getCollectionFn({ data: { id: params.collectionId } }),
			getTeamFn({
				data: {
					type: "learner",
				},
			}),
			getCollectionCoursesFn({
				data: {
					id: params.collectionId,
				},
			}),
			getConnectionFn({
				data: { type: "collection", id: params.collectionId },
			}),
			getAuthFn(),
		]);
	},
});

function RouteComponent() {
	const [collection, team, courses, connection, { user }] =
		Route.useLoaderData();
	const router = useRouter();

	const requestConnection = useMutation({
		mutationFn: requestConnectionFn,
		onSuccess: () => {
			router.invalidate();
		},
	});
	const connectionResponse = useMutation({
		mutationFn: userConnectionResponseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	return (
		<Page>
			<div className="flex flex-col gap-8 w-full">
				<ContentBranding
					contentTeam={collection.team}
					connectTeam={team}
				/>
				<PageHeader
					title={collection.name}
					description={collection.description}
				>
					{connection && (
						<ConnectionStatusBadge hideOnSuccess {...connection} />
					)}
				</PageHeader>
				<ConnectionWrapper
					name={collection.name}
					connection={connection}
					onRequest={() =>
						requestConnection.mutate({
							data: {
								type: "collection",
								id: collection.id,
							},
						})
					}
					onResponse={(status) => {
						connectionResponse.mutate({
							data: {
								type: "collection",
								id: collection.id,
								connectStatus: status,
							},
						});
					}}
				>
					<div className="flex flex-col gap-4">
						<h3>Courses</h3>
						{courses.map((course) => (
							<ConnectionComponent
								key={course.id}
								connection={connection!}
								{...course}
								type="course"
							/>
						))}
					</div>
				</ConnectionWrapper>
			</div>
		</Page>
	);
}
