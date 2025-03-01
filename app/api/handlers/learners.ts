import { db } from "@/api/db";
import { learners } from "@/api/db/schema";
import { UpdateLearnerSchema } from "@/types/learner";
import { LanguageSchema } from "@/types/translations";
import { zValidator } from "@hono/zod-validator";
import { inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

export const learnersHandler = new Hono()
	.get("/:id", async (c) => {
		// TODO: Recreate
		return c.json({ message: "Not implemented" });
	})
	.put(
		"/:id",
		zValidator(
			"json",
			UpdateLearnerSchema.omit({
				id: true,
			}),
		),
		async (c) => {
			// TODO: Recreate
			return c.json({ message: "Not implemented" });
		},
	)
	.post(
		"/:id/reinvite",
		zValidator(
			"json",
			z.object({
				inviteLanguage: LanguageSchema,
			}),
		),
		async (c) => {
			// TODO: Recreate
			return c.json({ message: "Not implemented" });
		},
	)
	.post("/:id/recertify", async (c) => {
		// TODO: Recreate
		return c.json({ message: "Not implemented" });
	})
	.delete("/:id", async (c) => {
		// TODO: Recreate
		return c.json({ message: "Not implemented" });
	})
	.delete(
		"/",
		zValidator(
			"json",
			z.object({
				ids: z.array(z.string()),
			}),
		),
		async (c) => {
			const { ids } = c.req.valid("json");

			await db.delete(learners).where(inArray(learners.id, ids));

			return c.json(null);
		},
	);
