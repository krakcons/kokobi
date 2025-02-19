import { db } from "@/server/db/db";
import { keys } from "@/server/db/schema";
import { generateId } from "@/server/helpers";
import { CreateKeySchema } from "@/types/keys";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { authMiddleware, protectedMiddleware } from "../middleware";

export const keysHandler = new Hono()
	.get("/", authMiddleware, protectedMiddleware(), async (c) => {
		const teamId = c.get("teamId");

		const keysList = await db.query.keys.findMany({
			where: eq(keys.teamId, teamId),
		});

		return c.json(keysList);
	})
	.post(
		"/",
		zValidator("json", CreateKeySchema.omit({ teamId: true })),
		authMiddleware,
		protectedMiddleware(),
		async (c) => {
			const teamId = c.get("teamId");
			const { name } = c.req.valid("json");

			await db.insert(keys).values({
				id: generateId(15),
				name,
				teamId,
				key: generateId(32),
			});

			return c.json(null);
		},
	)
	.delete("/:id", authMiddleware, protectedMiddleware(), async (c) => {
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
