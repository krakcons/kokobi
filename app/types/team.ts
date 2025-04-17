import { FileSchema } from "@/types/file";
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

export const TeamSchema = createSelectSchema(teams);
export type Team = z.infer<typeof TeamSchema>;

export const TeamTranslationSchema = createSelectSchema(teamTranslations);
export type TeamTranslation = z.infer<typeof TeamTranslationSchema>;

export const InviteMemberFormSchema = z.object({
	email: z.string().email(),
	role: z.enum(["owner", "member"]).optional().default("member"),
});
export type InviteMemberForm = z.infer<typeof InviteMemberFormSchema>;

export const TeamFormSchema = z.object({
	name: z.string(),
	logo: FileSchema.or(z.literal("")),
	favicon: FileSchema.or(z.literal("")),
});
export type TeamFormType = z.infer<typeof TeamFormSchema>;
