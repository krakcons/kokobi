import { z } from "zod";
import { LocaleSchema } from ".";

export const LocalizedInputSchema = z.object({
	locale: LocaleSchema,
	editingLocale: LocaleSchema,
	fallbackLocale: LocaleSchema.or(z.literal("none")),
});
export type LocalizedInputType = z.infer<typeof LocalizedInputSchema>;

export type LocalizationObject<T> = {
	en?: T | null;
	fr?: T | null;
};
