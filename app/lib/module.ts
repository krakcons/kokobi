import { IMSManifestSchema } from "@/types/scorm/content";
import { XMLParser } from "fast-xml-parser";
import { formatBytes } from "./helpers";
import { Module } from "@/types/module";
import { unzip } from "unzipit";

export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "",
});

export const validateModule = async (file: File) => {
	if (file.size > MAX_FILE_SIZE) {
		throw new Error(
			`Module is too large. Maximum file size is ${formatBytes(
				MAX_FILE_SIZE,
			)}.`,
		);
	}

	const fileBuffer = await file.arrayBuffer();
	const { entries } = await unzip(fileBuffer);

	// validate imsmanifest.xml exists
	const manifestFile = entries["imsmanifest.xml"];
	if (!manifestFile) {
		throw new Error("Module does not contain imsmanifest.xml file");
	}

	// validate imsmanifest.xml is valid scorm content
	const manifestText = await manifestFile.text();
	const IMSManifest = parser.parse(manifestText);

	const manifest = IMSManifestSchema.safeParse(IMSManifest);
	if (!manifest.success) {
		throw new Error("Invalid IMS Manifest");
	}

	const scorm = manifest.data.manifest;

	return {
		entries,
		type: scorm.metadata.schemaversion.toString() as Module["type"],
	};
};

export const shouldIgnoreFile = (path: string) => {
	// Adjusted pattern to match files starting with a dot anywhere in the path
	const ignoredPatterns = [/^__MACOSX\//, /\/\./, /^\./];
	return ignoredPatterns.some((pattern) => pattern.test(path));
};
