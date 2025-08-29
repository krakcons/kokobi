import { createOrpcContext } from "@/server/context";
import { router } from "@/server/router";
import { RPCHandler } from "@orpc/server/fetch";
import { createServerFileRoute } from "@tanstack/react-start/server";

const handler = new RPCHandler(router);

async function handle({ request }: { request: Request }) {
	const { response } = await handler.handle(request, {
		prefix: "/api/rpc",
		context: await createOrpcContext(),
	});

	return response ?? new Response("Not Found", { status: 404 });
}

export const ServerRoute = createServerFileRoute("/api/rpc/$").methods({
	HEAD: handle,
	GET: handle,
	POST: handle,
	PUT: handle,
	PATCH: handle,
	DELETE: handle,
});
