import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/lib/locale";
import { ConnectionType } from "@/types/connections";

export const ConnectionStatusBadge = ({
	connectStatus,
	connectType,
}: ConnectionType) => {
	const t = useTranslations("ConnectionStatuses");
	const tType = useTranslations("ConnectionTypes");
	const text = tType[connectType] + " " + t[connectStatus];

	return (
		<Badge
			variant={
				connectStatus === "accepted"
					? "success"
					: connectStatus === "pending"
						? "secondary"
						: "destructive"
			}
		>
			{text}
		</Badge>
	);
};
