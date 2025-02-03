import { z } from "zod";
import { LocaleSchema } from ".";

export const LocalizedQuerySchema = z
	.object({
		locale: LocaleSchema.optional(),
		fallback: z.boolean().default(true),
	})
	.optional();
export type LocalizedQueryType = z.infer<typeof LocalizedQuerySchema>;

export const LocalizedInputSchema = z.object({ locale: LocaleSchema });
export type LocalizedInputType = z.infer<typeof LocalizedInputSchema>;

export type FlattenedLocalized<
	TBase extends { translations: TTranslation[] },
	TTranslation extends { locale: string },
> = Omit<TBase, "translations"> & TTranslation;

export type LocalizationObject<T> = {
	en?: T | null;
	fr?: T | null;
};
