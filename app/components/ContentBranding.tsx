import { env } from "@/env";
import { Team, TeamTranslation } from "@/types/team";
import {
	TeamAvatar,
	TeamAvatarFallback,
	TeamAvatarImage,
} from "./ui/team-avatar";
import { Package } from "lucide-react";

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
			<TeamAvatar className="mr-2">
				<TeamAvatarImage
					src={`${env.VITE_SITE_URL}/cdn/${connectTeam.id}/${connectTeam.locale}/logo?updatedAt=${connectTeam.updatedAt}`}
					alt="Delivered by team logo"
					className="max-h-10"
				/>
				<TeamAvatarFallback className="h-10 w-10">
					<Package className="size-5" />
				</TeamAvatarFallback>
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
