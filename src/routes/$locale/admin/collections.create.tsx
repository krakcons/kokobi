import { CollectionForm } from "@/components/forms/CollectionForm";
import { Page, PageHeader } from "@/components/Page";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/collections/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const t = useTranslations("CollectionForm");
	const search = Route.useSearch();
	const createCollection = useMutation(
		orpc.collection.create.mutationOptions({
			onSuccess: (data) => {
				navigate({
					to: "/$locale/admin/collections/$collectionId/learners",
					params: (p) => ({
						...p,
						collectionId: data.collectionId,
					}),
					search: (s) => s,
				});
			},
			context: {
				headers: {
					locale: search.locale,
				},
			},
		}),
	);

	return (
		<Page>
			<PageHeader
				title={t.create.title}
				description={t.create.description}
			/>
			<CollectionForm
				onSubmit={(value) =>
					createCollection.mutateAsync({
						...value,
					})
				}
			/>
		</Page>
	);
}
