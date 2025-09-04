import { teamImageUrl } from "@/lib/file";
import type { Team, TeamTranslation } from "@/types/team";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";

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
			<div className="flex justify-between flex-col gap-6 px-24">
				<h2>{title}</h2>
				<div className="flex flex-col gap-5 pl-2">
					{UnderTitle}
					{description && <p>{description}</p>}
					{children}
				</div>
				<Separator className="mt-2 mb-4" />
			</div>
		</div>
	);
}

export const PublicTeamBranding = ({
	contentTeam,
}: {
	contentTeam: Team & TeamTranslation;
}) => (
	<div className="flex flex-row w-full items-center gap-2">
		<p className="text-muted-foreground">
			Created by <strong>{contentTeam.name}</strong>
		</p>
		<Avatar className="h-8 w-8 rounded-full grayscale">
			<AvatarFallback className="rounded-full">
				<img src={teamImageUrl(contentTeam, "logo")} alt="Team Logo" />
			</AvatarFallback>
		</Avatar>
	</div>
);
