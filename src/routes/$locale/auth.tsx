import { KokobiLogo } from "@/components/KokobiLogo";
import { OrganizationIcon } from "@/components/OrganizationIcon";
import { FloatingPage } from "@/components/Page";
import { organizationImageUrl } from "@/lib/file";
import { orpc } from "@/server/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import z from "zod";

export const RedirectSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/$locale/auth")({
	component: RouteComponent,
	validateSearch: RedirectSchema,
	beforeLoad: async ({ params, context: { queryClient } }) => {
		try {
			const auth = await queryClient.ensureQueryData(
				orpc.auth.session.queryOptions(),
			);
			if (auth) throw redirect({ to: "/$locale/admin", params });
		} catch (e) {}
	},
	loader: async ({ context: { queryClient } }) => {
		const tenant = await queryClient.ensureQueryData(
			orpc.auth.tenant.queryOptions(),
		);
		if (tenant) {
			await queryClient.ensureQueryData(
				orpc.organization.id.queryOptions({
					input: {
						id: tenant.id,
					},
				}),
			);
		}
	},
});

function RouteComponent() {
	const { data: tenant } = useSuspenseQuery(orpc.auth.tenant.queryOptions());
	const { data: organization } = useQuery(
		orpc.organization.id.queryOptions({
			input: {
				id: tenant?.id!,
			},
			enabled: !!tenant?.id,
		}),
	);

	return (
		<div className="pb-10">
			<div className="mt-6 ml-6">
				{organization ? (
					<OrganizationIcon
						src={organizationImageUrl(organization, "logo")}
						className="bg-popover"
					/>
				) : (
					<KokobiLogo />
				)}
			</div>

			<FloatingPage contentClassname="border-e-4 border-primary/20 border rounded-lg p-10 shadow-lg bg-popover">
				<Outlet />
			</FloatingPage>
		</div>
	);
}
