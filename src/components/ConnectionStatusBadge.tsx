import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/lib/locale";
import { ConnectionType } from "@/types/connections";

export const ConnectionStatusBadge = ({
	connectStatus,
	connectType,
	hideOnSuccess = false,
}: ConnectionType & { hideOnSuccess?: boolean }) => {
	const t = useTranslations("ConnectionStatuses");
	const tType = useTranslations("ConnectionTypes");
	const text = tType[connectType] + " " + t[connectStatus];

	if (hideOnSuccess && connectStatus === "accepted") {
		return null;
	}

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
