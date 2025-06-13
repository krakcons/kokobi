import { LocaleSchema } from "@/lib/locale";
import { z } from "zod";

export const EditingLocaleSchema = z.object({
	locale: LocaleSchema.optional(),
});
