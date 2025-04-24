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

	const updateCollection = useMutation({
		mutationFn: updateCollectionFn,
		onSuccess: () => {
			toast.success("Collection updated successfully.");
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
			<PageHeader
				title="Settings"
				description="Edit your collection settings"
			/>
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
				title="Delete Collection"
				description="This will delete the collection and all associated data. This action cannot be undone."
			/>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="destructive" className="self-start">
						<Trash />
						Delete
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you absolutely sure?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently
							delete your collection and remove all related data
							(ex. courses, learners, etc) from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								deleteCollection.mutate({
									data: { id: params.collectionId },
								});
							}}
						>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Page>
	);
}
