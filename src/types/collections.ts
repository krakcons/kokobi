import { collections, collectionTranslations } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const CollectionSchema = createSelectSchema(collections);
export type Collection = z.infer<typeof CollectionSchema>;

export const CollectionTranslationSchema = createSelectSchema(
	collectionTranslations,
);
export type CollectionTranslation = z.infer<typeof CollectionTranslationSchema>;

export const CollectionFormSchema = z.object({
	name: z.string().min(1),
	description: z.string(),
});
export type CollectionFormType = z.infer<typeof CollectionFormSchema>;
