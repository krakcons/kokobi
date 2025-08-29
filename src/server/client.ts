import { createRouterClient } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createIsomorphicFn } from "@tanstack/react-start";
import { router } from "./router";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createOrpcContext } from "./context";

const getORPCClient = createIsomorphicFn()
	.server(() => {
		return createRouterClient(router, {
			context: async () => await createOrpcContext(),
		});
	})
	.client((): RouterClient<typeof router> => {
		const link = new RPCLink({
			url: `${window.location.origin}/api/rpc`,
		});

		return createORPCClient(link);
	});

export const client: RouterClient<typeof router> = getORPCClient();
export const orpc = createTanstackQueryUtils(client);
