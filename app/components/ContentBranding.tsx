import { Team, TeamTranslation } from "@/types/team";
import { TeamIcon } from "./TeamIcon";
import { teamImageUrl } from "@/lib/file";

export const ContentBranding = ({
	contentTeam,
	connectTeam,
}: {
	contentTeam: Team & TeamTranslation;
	connectTeam: Team & TeamTranslation;
}) => {
	if (connectTeam.id === contentTeam.id) {
		return null;
	}
	return (
		<div className="flex items-center">
			<TeamIcon
				src={teamImageUrl(contentTeam, "logo")}
				className="max-h-8 mr-2"
			/>
			<p className="text-muted-foreground">
				Created by <strong>{contentTeam.name}</strong>
			</p>
		</div>
	);
};
