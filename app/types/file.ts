import { z } from "zod";

export const FileSchema = z.custom<File>((val) => val instanceof File);

export const ImageSchema = FileSchema.refine(
	(file) => file.size < 1024 * 1024,
).refine((file) => file.type.startsWith("image"), "Invalid image type");
