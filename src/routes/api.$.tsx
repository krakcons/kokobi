import { router } from "@/server/router";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { createOrpcContext } from "@/server/context";

const handler = new OpenAPIHandler(router, {
	plugins: [
		new OpenAPIReferencePlugin({
			docsProvider: "scalar", // default: 'scalar'
			schemaConverters: [new ZodToJsonSchemaConverter()],
			specGenerateOptions: {
				info: {
					title: "ORPC Playground",
					version: "1.0.0",
				},
			},
		}),
	],
});

async function handle({ request }: { request: Request }) {
	const { response } = await handler.handle(request, {
		prefix: "/api",
		context: await createOrpcContext(),
	});

	return response ?? new Response("Not Found", { status: 404 });
}

export const ServerRoute = createServerFileRoute("/api/$").methods({
	HEAD: handle,
	GET: handle,
	POST: handle,
	PUT: handle,
	PATCH: handle,
	DELETE: handle,
});
