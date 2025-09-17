import { LocaleSchema } from "@/lib/locale";
import { z } from "zod";

export const SearchSchema = z.object({
	redirect: z.string().optional(),
	redirectContext: z.string().optional(),
	redirectType: z
		.enum(["course", "collection", "learner_panel", "admin_panel"])
		.optional(),
	locale: LocaleSchema.optional(),
});
export type SearchParams = z.infer<typeof SearchSchema>;
