import { createFileRoute } from "@tanstack/react-router";
import LMSProvider from "@/components/LMSProvider";
import { queryOptions } from "@/lib/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { useTranslations } from "@/lib/locale";

export const Route = createFileRoute(
	"/$locale/play/$teamId/courses/$courseId/",
)({
	component: RouteComponent,
	validateSearch: z.object({
		learnerId: z.string(),
	}),
	loaderDeps: ({ search: { learnerId } }) => ({ learnerId }),
	loader: async ({ context: { queryClient }, params, deps }) => {
		await queryClient.ensureQueryData(
			queryOptions.courses.id({
				param: { id: params.courseId },
			}),
		);
		await queryClient.ensureQueryData(
			queryOptions.learners.play({
				param: {
					id: params.courseId,
					learnerId: deps.learnerId,
				},
			}),
		);
	},
});

function RouteComponent() {
	const { courseId } = Route.useParams();
	const [certOpen, setCertOpen] = useState(false);
	const search = Route.useSearch();
	const { data: course } = useSuspenseQuery(
		queryOptions.courses.id({
			param: { id: courseId },
		}),
	);
	const {
		data: { learner, url, type },
	} = useSuspenseQuery(
		queryOptions.learners.play({
			param: {
				id: courseId,
				learnerId: search.learnerId,
			},
		}),
	);
	const t = useTranslations("Certificate");

	useEffect(() => {
		const hidden = localStorage.getItem(learner.id);
		if (learner.completedAt && !hidden) {
			setCertOpen(true);
		}
	}, [learner.completedAt, learner.id]);

	return (
		<main className="flex h-screen w-full flex-col">
			<div className="flex flex-1 flex-row">
				<Dialog
					onOpenChange={(open) => setCertOpen(open)}
					open={certOpen}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{course.name} {t.dialog.title}
							</DialogTitle>
							<DialogDescription>
								{t.dialog.description}
							</DialogDescription>
						</DialogHeader>
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								onChange={(e) => {
									if (e.target.checked) {
										localStorage.setItem(
											learner.id,
											"true",
										);
									} else {
										localStorage.removeItem(learner.id);
									}
								}}
							/>
							<p className="text-sm">{t.dialog["dont-show"]}</p>
						</label>
						<Link
							to="/$locale/play/$teamId/courses/$courseId/certificate"
							params={(p) => p}
							from={Route.fullPath}
							search={{
								learnerId: learner.id,
							}}
							reloadDocument
							className={buttonVariants()}
						>
							{t.download}
						</Link>
					</DialogContent>
				</Dialog>
				<LMSProvider type={type} learner={learner} url={url} />
			</div>
		</main>
	);
}
