import { ImageSchema } from "@/types/file";
import { organizationTranslations, organizations } from "@/server/db/schema";
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

export const BaseOrganizationSchema = createSelectSchema(organizations);
export type BaseOrganization = z.infer<typeof BaseOrganizationSchema>;

export const OrganizationTranslationSchema = createSelectSchema(
	organizationTranslations,
);
export type OrganizationTranslation = z.infer<
	typeof OrganizationTranslationSchema
>;

export const OrganizationSchema = BaseOrganizationSchema.extend(
	OrganizationTranslationSchema.shape,
);
export type Organization = z.infer<typeof OrganizationSchema>;

export const OrganizationFormSchema = z.object({
	name: z.string(),
	logo: ImageSchema.or(z.literal("")),
	favicon: ImageSchema.or(z.literal("")),
});
export type OrganizationFormType = z.infer<typeof OrganizationFormSchema>;

export const roles = ["owner", "admin", "member"] as const;
export const RoleSchema = z.enum(roles);
export type Role = z.infer<typeof RoleSchema>;

export const OrganizationUsersFormSchema = z.object({
	users: z
		.object({
			email: z.email().toLowerCase(),
			role: z.enum(["owner", "admin", "member"]).optional(),
		})
		.array(),
});
export type OrganizationUsersFormType = z.infer<
	typeof OrganizationUsersFormSchema
>;
