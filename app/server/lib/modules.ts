import { XMLParser } from "fast-xml-parser";
import { IMSManifestSchema, Resource } from "@/types/scorm/content";
import { S3File } from "bun";
import { db } from "../db";
import { and, eq, max } from "drizzle-orm";
import { modules } from "../db/schema";
import { Locale } from "@/lib/locale";

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "",
});

export const getAllResources = (
	resource: Resource | Resource[],
): Resource[] => {
	const resources: Resource[] = [];

	const traverseResource = (res: Resource | Resource[]): void => {
		if (Array.isArray(res)) {
			res.forEach((subRes) => {
				resources.push(subRes);
				traverseResource(subRes);
			});
		} else if (res) {
			resources.push(res);
		}
	};

	traverseResource(resource);
	return resources;
};

export const parseIMSManifest = async (file: S3File) => {
	const text = await file.text();

	if (!text) throw new Error("404");

	const parsedIMSManifest = parser.parse(text);

	const scorm = IMSManifestSchema.parse(parsedIMSManifest).manifest;

	const firstOrganization = Array.isArray(scorm.organizations.organization)
		? scorm.organizations.organization[0]
		: scorm.organizations.organization;

	const resources = getAllResources(scorm.resources.resource);

	return {
		scorm,
		firstOrganization,
		resources,
	};
};

export const getNewModuleVersionNumber = async (
	locale: Locale,
	courseId: string,
) => {
	const newestModule = await db
		.select({
			versionNumber: max(modules.versionNumber),
		})
		.from(modules)
		.where(and(eq(modules.courseId, courseId), eq(modules.locale, locale)));

	return newestModule.length > 0 && newestModule[0].versionNumber
		? newestModule[0].versionNumber + 1
		: 1;
};
