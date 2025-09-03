import { createAuthClient } from "better-auth/react";
import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { queryOptions } from "@tanstack/react-query";

export const authClient = createAuthClient({
	plugins: [emailOTPClient(), organizationClient()],
});

export const authQueryOptions = {
	session: queryOptions({
		queryKey: ["session"],
		queryFn: () =>
			authClient.getSession(
				{},
				{
					throw: true,
				},
			),
	}),
	organization: {
		hasPermission: (
			input: Parameters<typeof authClient.organization.hasPermission>[0],
		) =>
			queryOptions({
				queryKey: ["organization", "permission", input],
				queryFn: async () => {
					const { data, error } =
						await authClient.organization.hasPermission(input);
					if (error) {
						throw error;
					}
					return data.success;
				},
			}),
		hasRolePermission: (
			input: Parameters<
				typeof authClient.organization.checkRolePermission
			>[0],
		) =>
			queryOptions({
				queryKey: ["organization", "rolePermission", input],
				queryFn: () =>
					authClient.organization.checkRolePermission(input),
			}),
		list: queryOptions({
			queryKey: ["organizations"],
			queryFn: () => authClient.organization.list(),
		}),
		listUserInvitations: queryOptions({
			queryKey: ["organizations", "userInvitations"],
			queryFn: () => authClient.organization.listUserInvitations(),
		}),
		listMembers: queryOptions({
			queryKey: ["organizations", "members"],
			queryFn: () => authClient.organization.listMembers(),
		}),
		listInvitations: queryOptions({
			queryKey: ["organizations", "invitations"],
			queryFn: () => authClient.organization.listInvitations(),
		}),
		getFullOrganization: queryOptions({
			queryKey: ["organization"],
			queryFn: () => authClient.organization.getFullOrganization(),
		}),
		getInvitation: ({ id }: { id: string }) =>
			queryOptions({
				queryKey: ["invitation", id],
				queryFn: () =>
					authClient.organization.getInvitation({
						query: {
							id,
						},
					}),
			}),
	},
};
