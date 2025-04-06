import { CollectionForm } from "@/components/forms/CollectionForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	deleteCollectionFn,
	getCollectionFn,
	updateCollectionFn,
} from "@/server/handlers/collections";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash } from "lucide-react";

export const Route = createFileRoute("/$locale/admin/collections/$id/settings")(
	{
		component: RouteComponent,
		loaderDeps: ({ search: { locale } }) => ({ locale }),
		loader: ({ params, deps }) =>
			getCollectionFn({
				data: {
					id: params.id,
				},
				headers: {
					...(deps.locale && { locale: deps.locale }),
					fallbackLocale: "none",
				},
			}),
	},
);
function RouteComponent() {
	const params = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const collection = Route.useLoaderData();
	const router = useRouter();

	const updateCollection = useMutation({
		mutationFn: updateCollectionFn,
		onSuccess: () => {
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
							id: params.id,
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
			<Button
				variant="destructive"
				onClick={() => {
					deleteCollection.mutate({
						data: { id: params.id },
					});
				}}
				className="self-start"
			>
				<Trash />
				Delete
			</Button>
		</Page>
	);
}
