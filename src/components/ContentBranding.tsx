import { organizationImageUrl } from "@/lib/file";
import { useTranslations } from "@/lib/locale";
import type { Organization } from "@/types/organization";
import { OrganizationIcon } from "./OrganizationIcon";

export const ContentBranding = ({
	contentOrganization,
	connectOrganization,
}: {
	contentOrganization: Organization;
	connectOrganization: Organization;
}) => {
	const t = useTranslations("Public");

	if (connectOrganization.id === contentOrganization.id) {
		return null;
	}
	return (
		<div className="flex items-center">
			<p className="text-muted-foreground text-sm">
				{t.createdBy} <strong>{contentOrganization.name}</strong>
			</p>
			<OrganizationIcon
				src={organizationImageUrl(contentOrganization, "logo")}
				className="max-h-8 ml-2"
			/>
		</div>
	);
};
