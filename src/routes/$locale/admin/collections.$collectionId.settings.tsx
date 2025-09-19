import { CollectionForm } from "@/components/forms/CollectionForm";
import { Page, PageHeader, PageSubHeader } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
import CopyButton from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute(
	"/$locale/admin/collections/$collectionId/settings",
)({
	component: RouteComponent,
	loaderDeps: ({ search: { locale } }) => ({ locale }),
	loader: ({ params, deps, context: { queryClient } }) =>
		queryClient.ensureQueryData(
			orpc.collection.id.queryOptions({
				input: { id: params.collectionId },
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
	const params = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const t = useTranslations("CollectionSettings");
	const tForm = useTranslations("CollectionForm");
	const tActions = useTranslations("Actions");
	const queryClient = useQueryClient();

	const { data: collection } = useSuspenseQuery(
		orpc.collection.id.queryOptions({
			input: {
				id: params.collectionId,
			},
			context: {
				headers: {
					locale: search.locale,
					fallbackLocale: "none",
				},
			},
		}),
	);

	const updateCollection = useMutation(
		orpc.collection.update.mutationOptions({
			onSuccess: () => {
				toast.success(tForm.updated);
				queryClient.invalidateQueries(
					orpc.collection.get.queryOptions(),
				);
			},
			context: {
				headers: {
					locale: search.locale,
				},
			},
		}),
	);

	const deleteCollection = useMutation(
		orpc.collection.delete.mutationOptions({
			onSuccess: () => {
				navigate({ to: "/$locale/admin" });
			},
		}),
	);

	return (
		<Page>
			<PageHeader title={t.title} description={t.description}>
				<Badge variant="secondary">
					<p>{collection.id}</p>
					<CopyButton text={collection.id} />
				</Badge>
			</PageHeader>
			<CollectionForm
				key={collection.locale}
				onSubmit={(value) =>
					updateCollection.mutateAsync({
						...value,
						id: params.collectionId,
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
									id: params.collectionId,
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
