import { createFileRoute, redirect } from "@tanstack/react-router";
import { useLMS } from "@/lib/lms";
import { useMutation } from "@tanstack/react-query";
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
import { Loader2, LogOut } from "lucide-react";
import { getCourseFn } from "@/server/handlers/courses";
import {
	createAttemptFn,
	playFn,
	updateAttemptFn,
} from "@/server/handlers/learners";

export const Route = createFileRoute("/$locale/learner/courses/$courseId/play")(
	{
		component: RouteComponent,
		validateSearch: z.object({
			attemptId: z.string().optional(),
		}),
		ssr: false,
		loaderDeps: ({ search: { attemptId } }) => ({ attemptId }),
		loader: async ({ params, deps }) => {
			if (!deps.attemptId) {
				const attemptId = await createAttemptFn({
					data: {
						courseId: params.courseId,
					},
				});
				throw redirect({
					to: `/$locale/learner/courses/$courseId/play`,
					params: {
						courseId: params.courseId,
					},
					search: {
						attemptId,
					},
				});
			}
			return Promise.all([
				getCourseFn({
					data: {
						courseId: params.courseId,
					},
				}),
				playFn({
					data: {
						courseId: params.courseId,
						attemptId: deps.attemptId,
					},
				}),
			]);
		},
	},
);

function RouteComponent() {
	const [certOpen, setCertOpen] = useState(false);
	const [course, { attempt, url, type }] = Route.useLoaderData();
	const t = useTranslations("Certificate");

	const [loading, setLoading] = useState(true);
	const [completed, setCompleted] = useState(!!attempt.completedAt);

	// Update learner mutation
	const { mutate } = useMutation({
		mutationFn: updateAttemptFn,
		onSuccess: (attempt) => {
			if (!completed && attempt.completedAt) {
				setCompleted(true);
			}
		},
	});

	const { isApiAvailable } = useLMS({
		type: type,
		initialData: attempt.data,
		onDataChange: (data) => {
			if (!attempt.completedAt) {
				mutate({
					data: {
						courseId: attempt.courseId,
						attemptId: attempt.id,
						data,
					},
				});
			}
		},
	});

	useEffect(() => {
		const hidden = localStorage.getItem(attempt.id);
		if (completed && !hidden) {
			setCertOpen(true);
		}
	}, [completed, attempt.id]);

	if (!isApiAvailable) {
		return <div>LMS not available. Please try again later.</div>;
	}

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
											attempt.id,
											"true",
										);
									} else {
										localStorage.removeItem(attempt.id);
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
								attemptId: attempt.id,
							}}
							reloadDocument
							className={buttonVariants()}
						>
							{t.download}
						</Link>
					</DialogContent>
				</Dialog>
				<Link
					to="/$locale/learner/courses/$courseId"
					params={{ courseId: course.id }}
					className={buttonVariants({
						size: "icon",
						className: "absolute right-4 bottom-4",
					})}
					reloadDocument
				>
					<LogOut />
				</Link>
				{loading && (
					<div className="absolute flex h-screen w-screen items-center justify-center bg-background">
						<Loader2 size={48} className="animate-spin" />
					</div>
				)}
				<iframe
					src={url}
					className="flex-1"
					onLoad={() => setLoading(false)}
				/>
			</div>
		</main>
	);
}
