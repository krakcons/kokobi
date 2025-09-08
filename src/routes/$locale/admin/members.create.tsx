import { MemberForm } from "@/components/forms/MembersForm";
import { Page, PageHeader } from "@/components/Page";
import { authClient } from "@/lib/auth.client";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/members/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const t = useTranslations("MemberCreate");

	const inviteMember = useMutation({
		mutationFn: async (
			data: Parameters<typeof authClient.organization.inviteMember>[0],
		) => {
			const { error } = await authClient.organization.inviteMember({
				...data,
			});
			if (error) {
				throw error;
			}
		},
		onSuccess: () => {
			navigate({
				to: "/$locale/admin/members",
				from: Route.fullPath,
			});
			queryClient.invalidateQueries(
				orpc.organization.member.get.queryOptions(),
			);
		},
	});

	return (
		<Page>
			<PageHeader title={t.title} description={t.description} />
			<MemberForm
				onSubmit={({ value }) =>
					inviteMember.mutateAsync({
						...value,
						resend: true,
					})
				}
			/>
		</Page>
	);
}
