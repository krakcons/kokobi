import { organizationImageUrl } from "@/lib/file";
import { useLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import type { Organization } from "@/types/organization";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { OrganizationIcon } from "./OrganizationIcon";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

export const PublicPage = ({ children }: { children: React.ReactNode }) => {
	return <div className={cn("gap-4 flex w-full flex-col")}>{children}</div>;
};

export function PublicPageHeader({
	title,
	description,
	UnderTitle = null,
	children,
	organization,
}: {
	title: string;
	description: string;
	UnderTitle?: React.ReactNode;
	children?: React.ReactNode;
	organization: Organization;
}) {
	return (
		<div className="flex flex-col justify-between w-full">
			<div className="flex flex-row items-center">
				<OrganizationIcon
					src={organizationImageUrl(organization, "logo")}
					className="max-h-14"
				/>
				<p className="text-muted-foreground text-sm ml-2 font-bold">
					{organization.name}
				</p>
			</div>

			<h2 className="my-3">{title}</h2>
			<div className="flex flex-col gap-5">
				{UnderTitle}
				{description && <p>{description}</p>}
				{children}
			</div>
			<Separator className="my-4" />
		</div>
	);
}

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
			<Card className="flex flex-row justify-between items-center">
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
