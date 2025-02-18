import { env } from "@/env";
import { AppType } from "@/server/api/hono";
import { hc } from "hono/client";

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
};
