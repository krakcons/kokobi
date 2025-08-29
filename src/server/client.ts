import { createRouterClient } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createIsomorphicFn } from "@tanstack/react-start";
import { router } from "./router";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createOrpcContext } from "./context";

type ClientContext = {
	headers?: Record<string, string | undefined>;
};

const getORPCClient = createIsomorphicFn()
	.server(() => {
		return createRouterClient(router, {
			context: async (context: ClientContext) => {
				const serverContext = await createOrpcContext();
				if (context.headers) {
					for (const header of Object.entries(context.headers)) {
						if (header[1] === undefined) continue;
						serverContext.headers.set(header[0], header[1]);
					}
				}
				return serverContext;
			},
		});
	})
	.client((): RouterClient<typeof router> => {
		const link = new RPCLink({
			url: `${window.location.origin}/api/rpc`,
			headers: async ({ context }: { context: ClientContext }) => ({
				...context.headers,
			}),
		});

		return createORPCClient(link);
	});

export const client: RouterClient<typeof router, ClientContext> =
	getORPCClient();
export const orpc = createTanstackQueryUtils(client);
