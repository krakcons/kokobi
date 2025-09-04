import { createFileRoute, Link } from "@tanstack/react-router";
import { useLMS } from "@/lib/lms";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "@/lib/locale";
import { ChevronLeft, Loader2 } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { UserButton } from "@/components/sidebars/UserButton";
import { buttonVariants } from "@/components/ui/button";
import { orpc } from "@/server/client";

export const Route = createFileRoute("/$locale/learner/courses/$courseId/play")(
	{
		component: RouteComponent,
		validateSearch: z.object({
			attemptId: z.string(),
		}),
		ssr: false,
		loaderDeps: ({ search: { attemptId } }) => ({ attemptId }),
		loader: ({ params, deps, context: { queryClient } }) =>
			Promise.all([
				queryClient.ensureQueryData(orpc.auth.session.queryOptions()),
				queryClient.ensureQueryData(
					orpc.learner.course.attempt.id.queryOptions({
						input: {
							id: params.courseId,
							attemptId: deps.attemptId,
						},
					}),
				),
			]),
	},
);

function RouteComponent() {
	const params = Route.useParams();
	const search = Route.useSearch();
	const t = useTranslations("Learner");
	const { isIframe } = Route.useRouteContext();
	const locale = useLocale();

	const { data: auth } = useSuspenseQuery(orpc.auth.session.queryOptions());

	const {
		data: {
			meta: { url, type },
			...initialAttempt
		},
	} = useSuspenseQuery(
		orpc.learner.course.attempt.id.queryOptions({
			input: {
				id: params.courseId,
				attemptId: search.attemptId,
			},
		}),
	);

	const [loading, setLoading] = useState(true);
	const [attempt, setAttempt] = useState(initialAttempt);

	// Update learner mutation
	const { mutate } = useMutation(
		orpc.learner.course.attempt.update.mutationOptions({
			onSuccess: (newAttempt) => {
				if (newAttempt) setAttempt(newAttempt);
			},
			scope: {
				id: attempt.id,
			},
		}),
	);

	const { isApiAvailable } = useLMS({
		type,
		initialData: initialAttempt.data,
		onDataChange: (data) => {
			if (attempt.completedAt === null) {
				mutate({
					id: attempt.courseId,
					attemptId: attempt.id,
					data,
				});
			}
		},
	});

	const { setOpen } = useSidebar();
	useEffect(() => {
		setOpen(false);
	}, []);

	if (!isApiAvailable) {
		return <div>LMS not available. Please try again later.</div>;
	}

	return (
		<main className="flex h-full min-h-[calc(100vh-80px)] w-full flex-col">
			<header className="p-4 flex flex-row items-center justify-between">
				{!isIframe ? (
					<SidebarTrigger />
				) : (
					<div className="flex flex-row items-center gap-2">
						<Link
							to="/$locale/learner/courses/$courseId"
							params={{
								locale,
								courseId: attempt.courseId,
							}}
							className={buttonVariants({
								variant: "ghost",
								size: "icon",
							})}
						>
							<ChevronLeft aria-label="Back" className="size-6" />
						</Link>
						<UserButton
							user={auth.user!}
							signOutRedirect={`/${locale}/auth/login?redirect=/learner/courses/${attempt.courseId}`}
						/>
					</div>
				)}
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
