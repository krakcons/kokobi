import { organizationImageUrl } from "@/lib/file";
import { useLocale } from "@/lib/locale";
import type { Organization } from "@/types/organization";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { OrganizationIcon } from "./OrganizationIcon";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

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
		<div className="flex flex-col gap-2 mt-4">
			<div className="flex justify-between flex-col px-24">
				<OrganizationIcon
					src={organizationImageUrl(organization, "logo")}
					className="max-h-12"
				/>
				<h2 className="my-3">{title}</h2>
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
