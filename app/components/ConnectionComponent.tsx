import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { useLocale } from "@/lib/locale";
import { ConnectionType } from "@/types/connections";
import { Link } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { ChevronRight } from "lucide-react";

export const ConnectionComponent = ({
	name,
	description,
	type,
	id,
	connection,
}: {
	name: string;
	description: string;
	type: "course" | "collection";
	id: string;
	connection: ConnectionType;
}) => {
	const locale = useLocale();
	return (
		<Link
			to={
				type === "course"
					? "/$locale/learner/courses/$courseId"
					: "/$locale/learner/collections/$collectionId"
			}
			params={{
				locale,
				collectionId: id,
				courseId: id,
			}}
		>
			<Card className="flex justify-between items-center">
				<CardHeader>
					<CardTitle>{name}</CardTitle>
					{description && (
						<CardDescription>{description}</CardDescription>
					)}
					{connection && (
						<ConnectionStatusBadge {...connection} hideOnSuccess />
					)}
				</CardHeader>
				<ChevronRight className="mr-2 size-6 min-w-6" />
			</Card>
		</Link>
	);
};
