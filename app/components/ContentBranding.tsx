import { env } from "@/env";
import { Team, TeamTranslation } from "@/types/team";

export const ContentBranding = ({
	team,
	connectTeam,
}: {
	team: Team & TeamTranslation;
	connectTeam: Team & TeamTranslation;
}) => {
	return (
		<div className="flex gap-4 items-center">
			<img
				src={`${env.VITE_SITE_URL}/cdn/${connectTeam.id}/${connectTeam.locale}/logo?updatedAt=${connectTeam.updatedAt}`}
				alt="Delivered by team logo"
				className="max-w-10 max-h-10 text-[0px]"
			/>
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
