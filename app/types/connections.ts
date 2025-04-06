import { usersToCollections, usersToCourses } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const UserToCourseSchema = createSelectSchema(usersToCourses);
export type UserToCourseType = z.infer<typeof UserToCourseSchema>;

export const UserToCollectionSchema = createSelectSchema(usersToCollections);
export type UserToCollectionType = z.infer<typeof UserToCollectionSchema>;

export const ConnectionSchema = z.object({
	connectType: z.enum(["invite", "request"]),
	connectStatus: z.enum(["pending", "accepted", "rejected"]),
});
export type ConnectionType = z.infer<typeof ConnectionSchema>;
