import { usersToCourses } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const UserToCourseSchema = createSelectSchema(usersToCourses);
export type UserToCourseType = z.infer<typeof UserToCourseSchema>;
