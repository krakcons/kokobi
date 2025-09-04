import type { Organization } from "@/types/team";
import { TeamIcon } from "./TeamIcon";
import { organizationImageUrl } from "@/lib/file";

export const ContentBranding = ({
	contentOrganization,
	connectOrganization,
}: {
	contentOrganization: Organization;
	connectOrganization: Organization;
}) => {
	if (connectOrganization.id === contentOrganization.id) {
		return null;
	}
	return (
		<div className="flex items-center">
			<TeamIcon
				src={organizationImageUrl(contentOrganization, "logo")}
				className="max-h-8 mr-2"
			/>
			<p className="text-muted-foreground">
				Created by <strong>{contentOrganization.name}</strong>
			</p>
		</div>
	);
};
