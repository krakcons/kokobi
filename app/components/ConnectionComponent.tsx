import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { PageSubHeader } from "@/components/Page";
import { useLocale } from "@/lib/locale";
import { ConnectionType } from "@/types/connections";
import { Link } from "@tanstack/react-router";

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
			className="w-full rounded-lg p-4 border flex flex-col gap-4"
		>
			<PageSubHeader
				title={name}
				description={description}
				className="items-start"
			>
				{connection && (
					<ConnectionStatusBadge {...connection} hideOnSuccess />
				)}
			</PageSubHeader>
		</Link>
	);
};
