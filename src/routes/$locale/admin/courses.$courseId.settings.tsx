import { CourseForm } from "@/components/forms/CourseForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";

export const Route = createFileRoute(
	"/$locale/admin/courses/$courseId/settings",
)({
	component: RouteComponent,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ params, deps, context: { queryClient } }) =>
		queryClient.ensureQueryData(
			orpc.course.id.queryOptions({
				input: {
					id: params.courseId,
				},
				context: {
					headers: {
						locale: deps.locale,
						fallbackLocale: "none",
					},
				},
			}),
		),
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const params = Route.useParams();
	const search = Route.useSearch();
	const course = Route.useLoaderData();
	const router = useRouter();
	const t = useTranslations("CourseSettings");
	const tActions = useTranslations("Actions");

	const updateCourse = useMutation(
		orpc.course.update.mutationOptions({
			context: {
				headers: {
					locale: search.locale,
				},
			},
			onSuccess: () => {
				toast.success("Course updated");
				router.invalidate();
			},
		}),
	);

	const deleteCourse = useMutation(
		orpc.course.delete.mutationOptions({
			onSuccess: () => {
				navigate({ to: "/$locale/admin" });
			},
		}),
	);

	return (
		<Page>
			<PageHeader title={t.title} description={t.description} />
			<CourseForm
				key={course.locale}
				defaultValues={course}
				onSubmit={(values) =>
					updateCourse.mutateAsync({
						...values,
						id: params.courseId,
					})
				}
			/>
			<Separator className="my-4" />
			<PageSubHeader
				title={t.delete.title}
				description={t.delete.description}
			/>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="destructive" className="self-start">
						<Trash />
						{tActions.delete}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t.delete.confirm.title}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t.delete.confirm.description}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tActions.cancel}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								deleteCourse.mutate({
									id: params.courseId,
								});
							}}
						>
							{tActions.continue}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Page>
	);
}
