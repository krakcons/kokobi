import { z } from "zod";

export const FileSchema = z.custom<File>((val) => val instanceof File);
