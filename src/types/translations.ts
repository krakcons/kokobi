import { courseTranslations } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const LanguageSchema =
	createSelectSchema(courseTranslations).shape.language;
export type Language = z.infer<typeof LanguageSchema>;
