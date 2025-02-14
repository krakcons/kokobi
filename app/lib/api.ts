import { env } from "@/env";
import { AppType } from "@/server/api/hono";
import { hc } from "hono/client";

export const client = hc<AppType>(env.VITE_SITE_URL, {
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
};
