import { CollectionForm } from "@/components/forms/CollectionForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { queryOptions, useMutationOptions } from "@/lib/api";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";

export const Route = createFileRoute("/$locale/admin/collections/$id/settings")(
	{
		component: RouteComponent,
		loaderDeps: ({ search: { locale } }) => ({ locale }),
		loader: async ({ params, context: { queryClient }, deps }) => {
			await queryClient.ensureQueryData(
				queryOptions.collections.id({
					param: {
						id: params.id,
					},
					query: {
						locale: deps.locale,
						"fallback-locale": "none",
					},
				}),
			);
		},
	},
);
function RouteComponent() {
	const params = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const { data: collection } = useSuspenseQuery(
		queryOptions.collections.id({
			param: {
				id: params.id,
			},
			query: {
				locale: search.locale,
				"fallback-locale": "none",
			},
		}),
	);

	const mutationOptions = useMutationOptions();
	const updateCollection = useMutation(mutationOptions.collections.update);
	const deleteCollection = useMutation(mutationOptions.collections.delete);

	return (
		<Page>
			<PageHeader
				title="Settings"
				description="Edit your collection settings"
			/>
			<CollectionForm
				onSubmit={(value) =>
					updateCollection.mutateAsync({
						json: value,
						param: {
							id: params.id,
						},
						query: {
							locale: search.locale,
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
				onClick={async () => {
					await deleteCollection.mutateAsync({
						param: { id: params.id },
					});
					await navigate({ to: "/$locale/admin" });
				}}
				className="self-start"
			>
				<Trash />
				Delete
			</Button>
		</Page>
	);
}
