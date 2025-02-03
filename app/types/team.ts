import { teamTranslations, teams } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { LanguageSchema } from "./translations";

export const validDomainSchema = z
	.string()
	.regex(
		new RegExp(
			/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
		),
		"Invalid domain format, use format (example.com)"
	);

export const TeamSchema = createSelectSchema(teams, {
	customDomain: validDomainSchema,
});
export type Team = z.infer<typeof TeamSchema>;

export const TeamTranslationSchema = createSelectSchema(teamTranslations);
export type TeamTranslation = z.infer<typeof TeamTranslationSchema>;

export const UpdateTeamTranslationSchema = TeamTranslationSchema.omit({
	teamId: true,
}).extend({
	name: z.string().min(1),
});
export type UpdateTeamTranslation = z.infer<typeof UpdateTeamTranslationSchema>;

export const CreateTeamSchema = z.object({
	name: z.string().min(1),
	language: LanguageSchema,
});
export type CreateTeam = z.infer<typeof CreateTeamSchema>;

export const InviteMemberFormSchema = z.object({
	email: z.string().email(),
	role: z.enum(["owner", "member"]).optional().default("member"),
});
export type InviteMemberForm = z.infer<typeof InviteMemberFormSchema>;
