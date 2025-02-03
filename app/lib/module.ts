import { UploadModule } from "@/types/module";
import { IMSManifestSchema } from "@/types/scorm/content";
import { XMLParser } from "fast-xml-parser";
import JSZip from "jszip";
import { z } from "zod";
import { formatBytes } from "./helpers";

export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "",
});

export const validateModule = async (file: File, ctx: z.RefinementCtx) => {
	const zip = new JSZip();

	const fileBuffer = await file.arrayBuffer();
	const course = await zip.loadAsync(fileBuffer);

	if (file.size > MAX_FILE_SIZE) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: `Module is too large. Maximum file size is ${formatBytes(
				MAX_FILE_SIZE
			)}.`,
			fatal: true,
		});
		return z.NEVER;
	}

	// validate imsmanifest.xml exists
	const manifestFile = course.file("imsmanifest.xml");
	if (!manifestFile) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Module does not contain imsmanifest.xml file",
			fatal: true,
		});
		return z.NEVER;
	}

	// validate imsmanifest.xml is valid scorm content
	const manifestText = await manifestFile.async("text");
	const IMSManifest = parser.parse(manifestText);

	const manifest = IMSManifestSchema.safeParse(IMSManifest);
	if (!manifest.success) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: manifest.error.issues[0].message,
			fatal: true,
		});
		return z.NEVER;
	}

	const scorm = manifest.data.manifest;

	return {
		file,
		upload: {
			name: Array.isArray(scorm.organizations.organization)
				? scorm.organizations.organization[0].title
				: scorm.organizations.organization.title,
			type: scorm.metadata.schemaversion.toString() as UploadModule["type"],
		},
	};
};

export const FileSchema = z.custom<File>((val) => val instanceof File);

export const ModuleFileSchema = FileSchema.superRefine(async (file, ctx) => {
	return await validateModule(file, ctx);
});
export type ModuleFile = z.infer<typeof ModuleFileSchema>;

export const ModuleUploadSchema = FileSchema.transform(async (file, ctx) => {
	return await validateModule(file, ctx);
});
export type ModuleUpload = z.infer<typeof ModuleUploadSchema>;
