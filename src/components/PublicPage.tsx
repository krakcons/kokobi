import type { Team, TeamTranslation } from "@/types/team";
import { Separator } from "./ui/separator";
import { teamImageUrl } from "@/lib/file";
import { TeamIcon } from "./TeamIcon";

export function PublicPageHeader({
	title,
	description,
	UnderTitle = null,
	children,
}: {
	title: string;
	description: string;
	UnderTitle?: React.ReactNode;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex justify-between flex-col gap-6 pl-24">
				<div className="flex flex-col gap-5">
					<h2>{title}</h2>
					{UnderTitle}
					{description && <p>{description}</p>}
				</div>
				{children}
			</div>
			<Separator className="mt-2 mb-4" />
		</div>
	);
}

export const PublicTeamBranding = ({
	contentTeam,
}: {
	contentTeam: Team & TeamTranslation;
}) => (
	<div className="flex items-center gap-2">
		<TeamIcon src={teamImageUrl(contentTeam, "logo")} className="max-h-8" />
		<p className="text-muted-foreground">
			Created by <strong>{contentTeam.name}</strong>
		</p>
	</div>
);
