import { MemberForm } from "@/components/forms/MembersForm";
import { Page, PageHeader } from "@/components/Page";
import { authClient } from "@/lib/auth.client";
import { useTranslations } from "@/lib/locale";
import { orpc } from "@/server/client";
import type { Role } from "@/types/organization";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/$locale/admin/members/$id")({
	component: RouteComponent,
	loader: async ({ params, context: { queryClient } }) => {
		const members = await queryClient.ensureQueryData(
			orpc.organization.member.get.queryOptions(),
		);

		const member = members.members.find((m) => m.id === params.id);

		if (!member) {
			throw notFound();
		}

		return member;
	},
});

function RouteComponent() {
	const member = Route.useLoaderData();
	const t = useTranslations("MemberEdit");
	const queryClient = useQueryClient();

	const updateMemberRole = useMutation({
		mutationFn: async (
			data: Parameters<
				typeof authClient.organization.updateMemberRole
			>[0],
		) => {
			const { error } =
				await authClient.organization.updateMemberRole(data);
			if (error) {
				throw error;
			}
		},
		onSuccess: () => {
			toast.success(t.toast);
			queryClient.invalidateQueries(
				orpc.organization.member.get.queryOptions(),
			);
		},
	});

	return (
		<Page>
			<PageHeader title={t.title} description={t.description} />
			<MemberForm
				defaultValues={{
					email: member.user.email,
					role: member.role as Role,
				}}
				disableEmail
				onSubmit={({ value }) =>
					updateMemberRole.mutateAsync({
						memberId: member.id,
						role: value.role,
					})
				}
			/>
		</Page>
	);
}
