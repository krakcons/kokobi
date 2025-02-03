import { users } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const UserSchema = createSelectSchema(users);
export type User = z.infer<typeof UserSchema>;
