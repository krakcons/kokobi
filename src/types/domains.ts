import { domains } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const DomainSchema = createSelectSchema(domains);
export type Domain = z.infer<typeof DomainSchema>;

export const DomainFormSchema = z.object({
	hostname: z
		.string()
		.regex(
			new RegExp(
				/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.+[a-zA-Z]{2,}$/,
			),
			"Invalid domain format, use format (learn.example.com)",
		),
});
export type DomainFormType = z.infer<typeof DomainFormSchema>;

export type DomainRecord = {
	required: boolean;
	status: string;
	type: string;
	name: string;
	value: string;
	priority?: number;
};
