import { env } from "@/env";
import { Team, TeamTranslation } from "@/types/team";
import { TeamAvatar, TeamAvatarImage } from "./ui/team-avatar";

export const ContentBranding = ({
	team,
	connectTeam,
}: {
	team: Team & TeamTranslation;
	connectTeam: Team & TeamTranslation;
}) => {
	return (
		<div className="flex gap-2 items-center">
			<TeamAvatar>
				<TeamAvatarImage
					src={`${env.VITE_SITE_URL}/cdn/${connectTeam.id}/${connectTeam.locale}/logo?updatedAt=${connectTeam.updatedAt}`}
					alt="Delivered by team logo"
					className="max-h-10"
				/>
			</TeamAvatar>
			<p>
				Delivered by <strong>{connectTeam.name}</strong>
			</p>
			{team.id !== connectTeam.id && (
				<p className="text-sm text-muted-foreground">
					Created by <strong>{team.name}</strong>
				</p>
			)}
		</div>
	);
};
