import CertificatePDF from "@/components/CertificatePDF";
import { LocaleToggle } from "@/components/LocaleToggle";
import { FloatingPage, PageHeader } from "@/components/Page";
import { PendingComponent } from "@/components/PendingComponent";
import { env } from "@/env";
import { formatDate } from "@/lib/date";
import { useLocale, useTranslations } from "@/lib/locale";
import { getLearnerCertificateFn } from "@/server/handlers/learners";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute(
	"/$locale/play/$teamId/courses/$courseId/certificate",
)({
	component: RouteComponent,
	pendingComponent: PendingComponent,
	validateSearch: z.object({
		learnerId: z.string(),
	}),
	loaderDeps: ({ search: { learnerId } }) => ({ learnerId }),
	loader: ({ params: { courseId }, deps }) =>
		getLearnerCertificateFn({
			data: {
				courseId,
				learnerId: deps.learnerId,
			},
		}),
});

function RouteComponent() {
	const t = useTranslations("Certificate");
	const certificate = Route.useLoaderData();
	const locale = useLocale();

	return (
		<FloatingPage className="items-stretch">
			<PageHeader title={t.title} description={t.message}>
				<LocaleToggle />
			</PageHeader>
			<CertificatePDF
				certificate={{
					teamName: certificate.team.name,
					logo: `${env.VITE_SITE_URL}/cdn/${certificate.team.id}/${locale}/logo`,
					name:
						certificate.learner.firstName +
						" " +
						certificate.learner.lastName,
					course: certificate.course.name,
					completedAt: formatDate({
						date: new Date(),
						locale,
					}),
					t: t.pdf,
				}}
			/>
		</FloatingPage>
	);
}
