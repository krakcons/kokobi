import { CollectionForm } from "@/components/forms/CollectionForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	deleteCollectionFn,
	getCollectionByIdFn,
	updateCollectionFn,
} from "@/server/handlers/collections";
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

export const Route = createFileRoute(
	"/$locale/admin/collections/$collectionId/settings",
)({
	component: RouteComponent,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ params, deps }) =>
		getCollectionByIdFn({
			data: {
				id: params.collectionId,
			},
			headers: {
				...(deps.locale && { locale: deps.locale }),
				fallbackLocale: "none",
			},
		}),
});
function RouteComponent() {
	const params = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const collection = Route.useLoaderData();
	const router = useRouter();
	const t = useTranslations("CollectionSettings");
	const tForm = useTranslations("CollectionForm");
	const tActions = useTranslations("Actions");

	const updateCollection = useMutation({
		mutationFn: updateCollectionFn,
		onSuccess: () => {
			toast.success(tForm.updated);
			router.invalidate();
		},
	});

	const deleteCollection = useMutation({
		mutationFn: deleteCollectionFn,
		onSuccess: () => {
			navigate({ to: "/$locale/admin" });
		},
	});

	return (
		<Page>
			<PageHeader title={t.title} description={t.description} />
			<CollectionForm
				key={collection.locale}
				onSubmit={(value) =>
					updateCollection.mutateAsync({
						data: {
							...value,
							id: params.collectionId,
						},
						headers: {
							...(search.locale && { locale: search.locale }),
						},
					})
				}
				defaultValues={{
					...collection,
				}}
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
								deleteCollection.mutate({
									data: { id: params.collectionId },
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
