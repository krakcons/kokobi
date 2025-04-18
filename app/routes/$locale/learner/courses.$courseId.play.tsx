import { createFileRoute } from "@tanstack/react-router";
import { useLMS } from "@/lib/lms";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/locale";
import { Loader2 } from "lucide-react";
import { getCourseFn } from "@/server/handlers/courses";
import { playFn, updateAttemptFn } from "@/server/handlers/learners";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/$locale/learner/courses/$courseId/play")(
	{
		component: RouteComponent,
		validateSearch: z.object({
			attemptId: z.string(),
		}),
		ssr: false,
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
	const t = useTranslations("Learner");

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
			<header className="px-4 py-2 flex flex-row items-center justify-between">
				<SidebarTrigger />
				<Badge>{t.statuses[attempt.status]}</Badge>
			</header>
			{loading && (
				<div className="absolute flex h-screen w-full items-center justify-center bg-background">
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
