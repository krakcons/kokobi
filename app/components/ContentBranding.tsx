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
	return (
		<div className="flex items-center">
			<TeamIcon
				src={teamImageUrl(contentTeam, "logo")}
				className="max-h-10 mr-2"
			/>
			<div className="flex gap-2 items-center">
				<p>
					Delivered by <strong>{connectTeam.name}</strong>
				</p>
				{contentTeam.id !== connectTeam.id && (
					<p className="text-sm text-muted-foreground">
						Created by <strong>{contentTeam.name}</strong>
					</p>
				)}
			</div>
		</div>
	);
};
