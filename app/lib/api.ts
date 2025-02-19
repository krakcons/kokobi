import { env } from "@/env";
import { AppType } from "@/server/api/hono";
import { MutationOptions, useQueryClient } from "@tanstack/react-query";
import { hc, InferRequestType } from "hono/client";

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
		all: {
			queryKey: ["courses"],
			queryFn: async () => {
				const res = await client.api.courses.$get();
				return await res.json();
			},
		},
		learners: (input: InferRequestType<typeof course.learners.$get>) => ({
			queryKey: ["learners", input.param.id],
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
	};
};
