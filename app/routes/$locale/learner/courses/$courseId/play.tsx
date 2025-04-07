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
import { useLocale, useTranslations } from "@/lib/locale";
import { Loader2, LogOut } from "lucide-react";
import { getCourseFn } from "@/server/handlers/courses";
import { playFn, updateAttemptFn } from "@/server/handlers/learners";

export const Route = createFileRoute("/$locale/learner/courses/$courseId/play")(
	{
		component: RouteComponent,
		validateSearch: z.object({
			attemptId: z.string(),
		}),
		loaderDeps: ({ search: { attemptId } }) => ({ attemptId }),
		loader: ({ params, deps }) =>
			Promise.all([
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
			]),
	},
);

function RouteComponent() {
	const [certOpen, setCertOpen] = useState(false);
	const [course, { attempt, url, type }] = Route.useLoaderData();
	const locale = useLocale();
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
		type,
		initialData: attempt.data,
		onDataChange: (data) => {
			console.log("Data changed", data);
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
			{completed && (
				<header className="flex flex-row justify-between gap-4 p-4 items-center">
					<p>{t.dialog.description}</p>
					<Link
						to="/$locale/learner/courses/$courseId"
						params={(p) => p}
						from={Route.fullPath}
						reloadDocument
						className={buttonVariants()}
					>
						Back to course
					</Link>
				</header>
			)}
			<Link
				to="/$locale/learner/courses/$courseId"
				params={{ courseId: course.id, locale }}
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
		</main>
	);
}
