import { env } from "@/env";
import { Team, TeamTranslation } from "@/types/team";
import { TeamAvatar, TeamAvatarImage } from "./ui/team-avatar";

export const ContentBranding = ({
	contentTeam,
	connectTeam,
}: {
	contentTeam: Team & TeamTranslation;
	connectTeam: Team & TeamTranslation;
}) => {
	console.log(contentTeam, connectTeam);
	return (
		<div className="flex items-center">
			<TeamAvatar>
				<TeamAvatarImage
					src={`${env.VITE_SITE_URL}/cdn/${connectTeam.id}/${connectTeam.locale}/logo?updatedAt=${connectTeam.updatedAt}`}
					alt="Delivered by team logo"
					className="max-h-10 mr-2"
				/>
			</TeamAvatar>
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
