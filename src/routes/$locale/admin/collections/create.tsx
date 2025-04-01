import { CollectionForm } from "@/components/forms/CollectionForm";
import { Page, PageHeader } from "@/components/Page";
import { useMutationOptions } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/collections/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const mutationOptions = useMutationOptions();
	const createCollection = useMutation(mutationOptions.collections.create);
	const search = Route.useSearch();

	return (
		<Page>
			<PageHeader
				title="Create Collection"
				description="Enter the details of your collection below."
			/>
			<CollectionForm
				onSubmit={async (value) => {
					const data = await createCollection.mutateAsync({
						json: value,
						query: {
							locale: search.locale,
						},
					});
					navigate({
						to: "/$locale/admin/collections/$id/learners",
						params: (p) => ({
							...p,
							id: data.id,
						}),
						search: (s) => s,
					});
				}}
			/>
		</Page>
	);
}
