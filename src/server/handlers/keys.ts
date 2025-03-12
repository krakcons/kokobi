import { db } from "@/server/db";
import { keys } from "@/server/db/schema";
import { APIKeyFormSchema } from "@/types/keys";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { protectedMiddleware } from "../middleware";
import { generateRandomString } from "@/server/random";

export const keysHandler = new Hono()
	.get("/", protectedMiddleware(), async (c) => {
		const teamId = c.get("teamId");

		const keysList = await db.query.keys.findMany({
			where: eq(keys.teamId, teamId),
		});

		return c.json(keysList);
	})
	.post(
		"/",
		zValidator("json", APIKeyFormSchema),
		protectedMiddleware(),
		async (c) => {
			const teamId = c.get("teamId");
			const { name } = c.req.valid("json");

			const key = generateRandomString(32);

			await db.insert(keys).values({
				id: Bun.randomUUIDv7(),
				name,
				teamId,
				key,
			});

			return c.json(null);
		},
	)
	.delete("/:id", protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		const key = await db.query.keys.findFirst({
			where: and(eq(keys.id, id), eq(keys.teamId, teamId)),
		});

		if (!key) {
			throw new HTTPException(404, {
				message: "Key not found.",
			});
		}

		await db
			.delete(keys)
			.where(and(eq(keys.id, id), eq(keys.teamId, teamId)));

		return c.json(null);
	});
