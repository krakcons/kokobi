import { createFileRoute, Link } from "@tanstack/react-router";
import { useLMS } from "@/lib/lms";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "@/lib/locale";
import { ChevronLeft, Loader2 } from "lucide-react";
import {
	getUserModuleFn,
	updateUserModuleFn,
} from "@/server/handlers/users.modules";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { AdminUserButton } from "@/components/sidebars/UserButton";
import { getAuthFn } from "@/server/handlers/auth";
import { buttonVariants } from "@/components/ui/button";

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
				getAuthFn(),
				getUserModuleFn({
					data: {
						courseId: params.courseId,
						attemptId: deps.attemptId,
					},
				}),
			]),
	},
);

function RouteComponent() {
	const [
		auth,
		{
			meta: { url, type },
			...initialAttempt
		},
	] = Route.useLoaderData();
	const t = useTranslations("Learner");
	const { isIframe } = Route.useRouteContext();
	const locale = useLocale();

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
						<AdminUserButton
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
