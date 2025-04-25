import { env } from "@/env";
import { Team, TeamTranslation } from "@/types/team";

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

export const teamImageUrl = (
	team: Team & TeamTranslation,
	type: "logo" | "favicon",
) => {
	return `${env.VITE_SITE_URL}/cdn/${team[type]}?updatedAt=${team.updatedAt.toISOString()}`;
};
