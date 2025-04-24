import { users } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const UserSchema = createSelectSchema(users);
export type User = z.infer<typeof UserSchema>;

export const UserFormSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
});
export type UserFormType = z.infer<typeof UserFormSchema>;
