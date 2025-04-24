import { createFileRoute } from "@tanstack/react-router";
import { useLMS } from "@/lib/lms";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { useTranslations } from "@/lib/locale";
import { Loader2 } from "lucide-react";
import {
	getUserModuleFn,
	updateUserModuleFn,
} from "@/server/handlers/users.modules";
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
			getUserModuleFn({
				data: {
					courseId: params.courseId,
					attemptId: deps.attemptId,
				},
			}),
	},
);

function RouteComponent() {
	const {
		meta: { url, type },
		...initialAttempt
	} = Route.useLoaderData();
	const t = useTranslations("Learner");

	const [loading, setLoading] = useState(true);
	const [attempt, setAttempt] = useState(initialAttempt);

	// Update learner mutation
	const { mutate } = useMutation({
		mutationFn: updateUserModuleFn,
		onSuccess: (newAttempt) => {
			if (newAttempt) setAttempt(newAttempt);
		},
		scope: {
			id: attempt.id,
		},
	});

	const { isApiAvailable } = useLMS({
		type,
		initialData: initialAttempt.data,
		onDataChange: (data) => {
			if (attempt.completedAt === null) {
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
