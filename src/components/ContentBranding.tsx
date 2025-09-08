import { teamImageUrl } from "@/lib/file";
import { useTranslations } from "@/lib/locale";
import type { Team, TeamTranslation } from "@/types/team";
import { TeamIcon } from "./TeamIcon";

export const ContentBranding = ({
	contentTeam,
	connectTeam,
}: {
	contentTeam: Team & TeamTranslation;
	connectTeam: Team & TeamTranslation;
}) => {
	const t = useTranslations("Public");

	if (connectTeam.id === contentTeam.id) {
		return null;
	}
	return (
		<div className="flex items-center">
			<p className="text-muted-foreground text-sm">
				{t.createdBy} <strong>{contentTeam.name}</strong>
			</p>
			<TeamIcon
				src={teamImageUrl(contentTeam, "logo")}
				className="max-h-8 ml-2"
			/>
		</div>
	);
};
