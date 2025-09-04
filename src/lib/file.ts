import { env } from "@/env";
import type { Organization } from "@/types/team";

export const fetchFile = async (fileUrl?: string): Promise<File | ""> => {
	if (!fileUrl) return "";
	const response = await fetch(fileUrl);
	if (!response.ok) {
		return "";
	}
	const blob = await response.blob();
	const filename = fileUrl.split("/").pop(); // Extract filename from URL
	return new File([blob], filename!, { type: blob.type });
};

export const organizationImageUrl = (
	organization: Organization,
	type: "logo" | "favicon",
) => {
	// If the team has a logo or favicon, return the URL
	if (organization[type]) {
		return `${env.VITE_SITE_URL}/cdn/${organization[type]}?updatedAt=${organization.updatedAt.toISOString()}`;
	}
	// Otherwise, return undefined
	return undefined;
};
