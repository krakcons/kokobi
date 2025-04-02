import { Certificate } from "@/components/Certificate";
import { LanguageToggle } from "@/components/LanguageToggle";
import { FloatingPage, PageHeader } from "@/components/Page";
import { queryOptions } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { useLocale, useTranslations } from "@/lib/locale";
import { PDFViewer } from "@react-pdf/renderer";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute(
	"/$locale/play/$teamId/courses/$courseId/certificate",
)({
	component: RouteComponent,
	validateSearch: z.object({
		learnerId: z.string(),
	}),
	loaderDeps: ({ search: { learnerId } }) => ({ learnerId }),
	loader: async ({
		params: { courseId },
		deps,
		context: { queryClient },
	}) => {
		await queryClient.ensureQueryData(
			queryOptions.learners.certificate({
				param: {
					id: courseId,
					learnerId: deps.learnerId,
				},
			}),
		);
	},
});

function RouteComponent() {
	const params = Route.useParams();
	const search = Route.useSearch();
	const t = useTranslations("Certificate");
	const {
		data: { learner, team, course },
	} = useSuspenseQuery(
		queryOptions.learners.certificate({
			param: {
				id: params.courseId,
				learnerId: search.learnerId,
			},
		}),
	);
	const locale = useLocale();

	return (
		<FloatingPage className="items-stretch">
			<PageHeader title={t.title} description={t.message}>
				<LanguageToggle />
			</PageHeader>
			<PDFViewer className="h-[700px] w-full">
				<Certificate
					{...{
						teamName: team.name,
						teamLogo: `${window.location.origin}/cdn/${team.id}/${locale}/logo`,
						name: learner.firstName + " " + learner.lastName,
						course: course.name,
						completedAt: formatDate({
							date: new Date(),
							locale,
						}),
						t: t.pdf,
					}}
				/>
			</PDFViewer>
		</FloatingPage>
	);
}
