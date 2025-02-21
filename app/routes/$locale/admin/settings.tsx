import { client, queryOptions } from "@/lib/api";
import { TeamFormType } from "@/types/team";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/settings")({
	component: RouteComponent,
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(queryOptions.user.me);
	},
});

function RouteComponent() {
	//const editTeam = useMutation({
	//	mutationFn: async (values: TeamFormType) => {
	//		let logoUrl: string | null = null;
	//		if (values.logo) {
	//			const presignedRes = await client.api.teams.logo.$post({
	//				json: {
	//					language: values.language,
	//				},
	//			});
	//			const { url, imageUrl } = await presignedRes.json();
	//			const contentType = values.logo.type;
	//
	//			await fetch(url, {
	//				method: "PUT",
	//				headers: contentType
	//					? new Headers({
	//							"Content-Type": contentType,
	//						})
	//					: undefined,
	//				body: values.logo,
	//			});
	//			logoUrl = imageUrl + "?" + Date.now();
	//		}
	//
	//		let faviconUrl: string | null = null;
	//		if (values.favicon) {
	//			const presignedRes = await client.api.teams.favicon.$post({
	//				json: {
	//					language: values.language,
	//				},
	//			});
	//			const { url, imageUrl } = await presignedRes.json();
	//			const contentType = values.favicon.type;
	//
	//			await fetch(url, {
	//				method: "PUT",
	//				headers: contentType
	//					? new Headers({
	//							"Content-Type": contentType,
	//						})
	//					: undefined,
	//				body: values.favicon,
	//			});
	//			faviconUrl = imageUrl + "?" + Date.now();
	//		}
	//
	//		const currentLogo = translate(translations, values.language).logo;
	//		const currentFavicon = translate(
	//			translations,
	//			values.language,
	//		).favicon;
	//		return client.api.teams[":id"].$put({
	//			param: { id: teamId },
	//			json: {
	//				...values,
	//				logo: logoUrl ?? currentLogo,
	//				favicon: faviconUrl ?? currentFavicon,
	//			},
	//		});
	//	},
	//	onSuccess: () => {
	//		router.invalidate();
	//		toast("Team updated successfully");
	//	},
	//});

	return <div>Hello "/$locale/admin/settings"!</div>;
}
