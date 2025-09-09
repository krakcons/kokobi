import { apikeys } from "@/server/db/auth";
import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import { UserSchema } from "./users";

export const APIKeyMetaSchema = z.object({
	organizationId: z.string(),
});
export type APIKeyMetaType = z.infer<typeof APIKeyMetaSchema>;

export const APIKeySchema = createSelectSchema(apikeys)
	.omit({
		key: true,
	})
	.extend({
		user: UserSchema,
		metadata: APIKeyMetaSchema,
	});
export type APIKey = z.infer<typeof APIKeySchema>;

export const APIKeyFormSchema = z.object({
	name: z.string(),
});
export type APIKeyFormType = z.infer<typeof APIKeyFormSchema>;
