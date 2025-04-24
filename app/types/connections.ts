import {
	teamsToCourses,
	usersToCollections,
	usersToCourses,
	usersToTeams,
} from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const UserToCourseSchema = createSelectSchema(usersToCourses);
export type UserToCourseType = z.infer<typeof UserToCourseSchema>;

export const UserToCollectionSchema = createSelectSchema(usersToCollections);
export type UserToCollectionType = z.infer<typeof UserToCollectionSchema>;

export const TeamToCourseSchema = createSelectSchema(teamsToCourses);
export type TeamToCourseType = z.infer<typeof TeamToCourseSchema>;

export const UserToTeamSchema = createSelectSchema(usersToTeams);
export type UserToTeamType = z.infer<typeof UserToTeamSchema>;

export const ConnectionSchema = z.object({
	connectType: z.enum(["invite", "request"]),
	connectStatus: z.enum(["pending", "accepted", "rejected"]),
});
export type ConnectionType = z.infer<typeof ConnectionSchema>;

export const GetConnectionSchema = z.object({
	type: z.enum(["course", "collection"]),
	id: z.string(),
});
