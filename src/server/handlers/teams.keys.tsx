import { db } from "@/server/db";
import { keys } from "@/server/db/schema";
import { APIKeyFormSchema } from "@/types/keys";
import { and, eq } from "drizzle-orm";
import { teamMiddleware } from "../lib/middleware";
import { generateRandomString } from "@/server/lib/random";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getTeamKeysFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware()])
	.handler(async ({ context }) => {
		const teamId = context.teamId;

		const keysList = await db.query.keys.findMany({
			where: eq(keys.teamId, teamId),
		});

		return keysList;
	});

export const createTeamKeyFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware()])
	.validator(APIKeyFormSchema)
	.handler(async ({ context, data }) => {
		const teamId = context.teamId;

		const key = generateRandomString(32);

		await db.insert(keys).values({
			id: Bun.randomUUIDv7(),
			name: data.name,
			teamId,
			key,
		});

		return null;
	});

export const deleteTeamKeyFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware()])
	.validator(z.object({ id: z.string() }))
	.handler(async ({ context, data: { id } }) => {
		const teamId = context.teamId;

		await db
			.delete(keys)
			.where(and(eq(keys.id, id), eq(keys.teamId, teamId)));

		return null;
	});
