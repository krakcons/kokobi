import { teamImageUrl } from "@/lib/file";
import { useLocale, useTranslations } from "@/lib/locale";
import type { Team, TeamTranslation } from "@/types/team";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
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
}) => {
	const t = useTranslations("Public");

	return (
		<div className="flex flex-row w-full items-center gap-2">
			<p className="text-muted-foreground">
				{t.createdBy} <strong>{contentTeam.name}</strong>
			</p>
			<Avatar className="h-8 w-8 rounded-full grayscale">
				<AvatarFallback className="rounded-full">
					<img
						src={teamImageUrl(contentTeam, "logo")}
						alt="Team Logo"
					/>
				</AvatarFallback>
			</Avatar>
		</div>
	);
};

export const PublicCourseCard = ({
	name,
	description,
	type,
	id,
}: {
	name: string;
	description: string;
	type: "course" | "collection";
	id: string;
}) => {
	const locale = useLocale();

	return (
		<Link
			to={
				type === "course"
					? "/$locale/courses/$courseId"
					: "/$locale/collections/$collectionId"
			}
			params={{
				locale,
				collectionId: id,
				courseId: id,
			}}
		>
			<Card className="flex flex-row justify-between items-center mr-24">
				<CardHeader className="flex-1">
					<CardTitle>{name}</CardTitle>
					{description && (
						<CardDescription>{description}</CardDescription>
					)}
				</CardHeader>
				<ChevronRight className="mr-2 size-6 min-w-6" />
			</Card>
		</Link>
	);
};
