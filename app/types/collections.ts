import { collectionTranslations, collections } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const CollectionSchema = createSelectSchema(collections);
export type Collection = z.infer<typeof CollectionSchema>;

export const CreateCollectionSchema = CollectionSchema.omit({
	id: true,
	teamId: true,
});
export type CreateCollection = z.infer<typeof CreateCollectionSchema>;

export const CollectionTranslationSchema = createSelectSchema(
	collectionTranslations
);
export type CollectionTranslation = z.infer<typeof CollectionTranslationSchema>;

export const CreateCollectionTranslationSchema =
	CollectionTranslationSchema.pick({
		name: true,
		description: true,
		language: true,
		default: true,
	}).extend({
		name: z.string().min(1),
	});
export type CreateCollectionTranslation = z.infer<
	typeof CreateCollectionTranslationSchema
>;
