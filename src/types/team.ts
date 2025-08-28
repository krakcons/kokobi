import { ImageSchema } from "@/types/file";
import { teamTranslations, teams } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const validDomainSchema = z
	.string()
	.regex(
		new RegExp(
			/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
		),
		"Invalid domain format, use format (example.com)",
	);

export const BaseTeamSchema = createSelectSchema(teams);

export const TeamTranslationSchema = createSelectSchema(teamTranslations);
export type TeamTranslation = z.infer<typeof TeamTranslationSchema>;

export const TeamSchema = BaseTeamSchema.extend(TeamTranslationSchema.shape);
export type Team = z.infer<typeof TeamSchema>;

export const TeamFormSchema = z.object({
	name: z.string(),
	logo: ImageSchema.or(z.literal("")),
	favicon: ImageSchema.or(z.literal("")),
});
export type TeamFormType = z.infer<typeof TeamFormSchema>;

export const roles = ["owner", "member"] as const;
export const RoleSchema = z.enum(roles);
export type Role = z.infer<typeof RoleSchema>;

export const TeamUsersFormSchema = z.object({
	users: z
		.object({
			email: z.email().toLowerCase(),
			role: z.enum(["owner", "member"]).optional(),
		})
		.array(),
});
export type TeamUsersFormType = z.infer<typeof TeamUsersFormSchema>;
