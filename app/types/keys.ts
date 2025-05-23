import { keys } from "@/server/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const KeySchema = createSelectSchema(keys);
export type Key = z.infer<typeof KeySchema>;

export const CreateKeySchema = createInsertSchema(keys).omit({
	key: true,
});
export type CreateKey = z.infer<typeof CreateKeySchema>;

export const APIKeyFormSchema = z.object({
	name: z.string().min(1),
});
export type APIKeyFormType = z.infer<typeof APIKeyFormSchema>;
