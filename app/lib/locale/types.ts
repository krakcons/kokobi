import { z } from "zod";
import { LocaleSchema } from ".";

export const LocalizedInputSchema = z.object({
	locale: LocaleSchema.default("en"),
	fallbackLocale: LocaleSchema.or(z.literal("none")).optional(),
});
export type LocalizedInputType = z.infer<typeof LocalizedInputSchema>;

export type LocalizationObject<T> = {
	en?: T | null;
	fr?: T | null;
};
