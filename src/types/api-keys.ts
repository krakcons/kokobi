import { apikeys } from "@/server/db/auth";
import { createSelectSchema } from "drizzle-zod";
import z from "zod";
import { UserSchema } from "./users";

export const APIKeySchema = createSelectSchema(apikeys)
	.omit({
		key: true,
	})
	.extend({
		user: UserSchema,
	});
export type APIKey = z.infer<typeof APIKeySchema>;

export const APIKeyFormSchema = z.object({
	name: z.string(),
});
export type APIKeyFormType = z.infer<typeof APIKeyFormSchema>;

export type APIKeyMetadata = {
	organizationId: string;
};
