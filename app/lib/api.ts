import { AppType } from "@/server/api/hono";
import { useQueryClient } from "@tanstack/react-query";
import { hc, InferRequestType } from "hono/client";
import { toast } from "sonner";

export const client = hc<AppType>(window.location.origin, {
	init: {
		credentials: "include",
	},
});

const course = client.api.courses[":id"];
const key = client.api.keys[":id"];

export const queryOptions = {
	user: {
		me: {
			queryKey: ["user", "me"],
			queryFn: async () => {
				const res = await client.api.user.me.$get();
				return await res.json();
			},
		},
		teams: {
			queryKey: ["user", "teams"],
			queryFn: async () => {
				const res = await client.api.user.teams.$get();
				return await res.json();
			},
		},
		preferences: {
			queryKey: ["user", "preferences"],
			queryFn: async () => {
				const res = await client.api.user.preferences.$get();
				return await res.json();
			},
		},
		i18n: {
			queryKey: ["i18n"],
			queryFn: async () => {
				const res = await client.api.user.i18n.$get();
				return await res.json();
			},
		},
	},
	team: {
		me: (input: InferRequestType<typeof client.api.team.$get>) => ({
			queryKey: ["editing-locale", "team", input],
			queryFn: async () => {
				const res = await client.api.team.$get(input);
				return await res.json();
			},
		}),
	},
	courses: {
		id: (input: InferRequestType<typeof course.$get>) => ({
			queryKey: ["editing-locale", "courses", input],
			queryFn: async () => {
				const res = await course.$get(input);
				if (!res.ok) {
					throw new Error(await res.text());
				}
				return await res.json();
			},
		}),
		all: {
			queryKey: ["courses"],
			queryFn: async () => {
				const res = await client.api.courses.$get();
				return await res.json();
			},
		},
		learners: (input: InferRequestType<typeof course.learners.$get>) => ({
			queryKey: ["learners", input],
			queryFn: async () => {
				const res = await course.learners.$get(input);
				return await res.json();
			},
		}),
	},
	collections: {
		all: {
			queryKey: ["collections"],
			queryFn: async () => {
				const res = await client.api.collections.$get();
				return await res.json();
			},
		},
	},
	keys: {
		all: {
			queryKey: ["keys"],
			queryFn: async () => {
				const res = await client.api.keys.$get();
				return await res.json();
			},
		},
	},
};

export const useMutationOptions = () => {
	const queryClient = useQueryClient();

	return {
		keys: {
			delete: {
				mutationFn: async (
					input: InferRequestType<typeof key.$delete>,
				) => {
					const res = await key.$delete(input);
					if (!res.ok) {
						const text = await res.text();
						throw new Error(text);
					}
				},
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: queryOptions.keys.all.queryKey,
					});
				},
			},
		},
		course: {
			create: {
				mutationFn: async (
					input: InferRequestType<typeof client.api.courses.$post>,
				) => {
					const res = await client.api.courses.$post(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
					return await res.json();
				},
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: queryOptions.courses.all.queryKey,
					});
				},
			},
			update: {
				mutationFn: async (
					input: InferRequestType<typeof course.$put>,
				) => {
					const res = await course.$put(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
				},
				onSuccess: async (_: any, variables: any) => {
					queryClient.invalidateQueries({
						queryKey: queryOptions.courses.id({
							param: {
								id: variables.param.id,
							},
						}).queryKey,
					});
					queryClient.invalidateQueries({
						queryKey: queryOptions.courses.all.queryKey,
					});
					toast.success("Course updated successfully");
				},
			},
			delete: {
				mutationFn: async (
					input: InferRequestType<typeof course.$delete>,
				) => {
					const res = await course.$delete(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
				},
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: queryOptions.courses.all.queryKey,
					});
					toast.success("Course deleted successfully");
				},
			},
		},
		user: {
			preferences: {
				mutationFn: async (
					input: InferRequestType<
						typeof client.api.user.preferences.$put
					>,
				) => {
					const res = await client.api.user.preferences.$put(input);
					if (!res.ok) {
						console.log("error from here");
						throw new Error(await res.text());
					}
				},
				onSuccess: (_: any, variables: any) => {
					queryClient.invalidateQueries({
						queryKey: queryOptions.user.preferences.queryKey,
					});
					if (variables.json.editingLocale) {
						queryClient.invalidateQueries({
							queryKey: ["editing-locale"],
						});
					}
					if (variables.json.locale) {
						queryClient.invalidateQueries({
							queryKey: queryOptions.user.i18n.queryKey,
						});
					}
					if (variables.json.teamId) {
						queryClient.invalidateQueries();
					}
				},
			},
		},
		team: {
			create: {
				mutationFn: async (
					input: InferRequestType<typeof client.api.team.$post>,
				) => {
					const res = await client.api.team.$post(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
					return await res.json();
				},
				onSuccess: () => {
					queryClient.invalidateQueries();
					toast.success("Team created successfully");
				},
			},
			update: {
				mutationFn: async (
					input: InferRequestType<typeof client.api.team.$put>,
				) => {
					const res = await client.api.team.$put(input);
					if (!res.ok) {
						throw new Error(await res.text());
					}
				},
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: queryOptions.team.me({
							query: {
								"fallback-locale": "none",
							},
						}).queryKey,
					});
					queryClient.invalidateQueries({
						queryKey: queryOptions.user.teams.queryKey,
					});
					toast.success("Team updated successfully");
				},
			},
		},
	};
};
