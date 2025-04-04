import { domains } from "@/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const DomainSchema = createSelectSchema(domains);
export type Domain = z.infer<typeof DomainSchema>;
