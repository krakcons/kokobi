import { env } from "@/env";
import { AppType } from "@/server/api/hono";
import { MutationOptions, useQueryClient } from "@tanstack/react-query";
import { ClientRequestOptions, hc, InferRequestType } from "hono/client";
import { toast } from "sonner";

const getHeaders = async () => {
	if (typeof window === "undefined") {
		const { getHeaders: getHeadersServer } = await import("vinxi/http");
		return getHeadersServer();
	}
	return {};
};

export const client = hc<AppType>(env.VITE_SITE_URL, {
	// @ts-ignore
	headers: getHeaders,
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
	},
	courses: {
		id: (
			input: InferRequestType<typeof course.$get>,
			options?: ClientRequestOptions,
		) => ({
			queryKey: ["courses", input, options],
			queryFn: async () => {
				const res = await course.$get(input, options);
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

export const useMutationOptions = (): {
	[key: string]: {
		[key: string]: MutationOptions<any, any, any, any>;
	};
} => {
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
				onSuccess: async (_, variables) => {
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
					toast("Course updated successfully");
				},
			},
		},
	};
};
