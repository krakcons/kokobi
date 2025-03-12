import { modules } from "@/api/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { FileSchema } from "./file";

export const ModuleSchema = createSelectSchema(modules);
export type Module = z.infer<typeof ModuleSchema>;

export const DeleteModuleSchema = ModuleSchema.pick({
	id: true,
});
export type DeleteModule = z.infer<typeof DeleteModuleSchema>;

export const SelectModuleSchema = ModuleSchema.pick({
	id: true,
});
export type SelectModule = z.infer<typeof SelectModuleSchema>;

export const ModuleFormSchema = z.object({
	file: FileSchema.or(z.literal("")),
});
export type ModuleFormType = z.infer<typeof ModuleFormSchema>;
