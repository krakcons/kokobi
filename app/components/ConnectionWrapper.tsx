import { ConnectionType } from "@/types/connections";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/locale";

export const ConnectionWrapper = ({
	children,
	name,
	connection,
	onRequest,
	onResponse,
}: {
	children: React.ReactNode;
	name: string;
	connection?: ConnectionType;
	onRequest: () => void;
	onResponse: (status: "accepted" | "rejected") => void;
}) => {
	const t = useTranslations("ConnectionWrapper");
	const tActions = useTranslations("ConnectionActions");
	const tTypes = useTranslations("ConnectionTypes");
	if (connection?.connectStatus === "accepted") {
		return children;
	}

	if (!connection || connection.connectType === "request") {
		if (connection) {
			if (connection.connectStatus === "rejected") {
				return <p>{t.rejected}</p>;
			} else {
				return <p>{t.requested}</p>;
			}
		} else {
			return (
				<div className="flex flex-col gap-4 sm:items-start">
					<p>
						{t.request} "{name}"?
					</p>
					<Button onClick={onRequest}>{tTypes.request}</Button>
				</div>
			);
		}
	}

	if (connection.connectType === "invite") {
		return (
			<div className="flex flex-col gap-4">
				<p>
					{t.invited} "{name}".
				</p>
				<div className="flex gap-2">
					{["pending", "rejected"].includes(
						connection.connectStatus,
					) && (
						<Button
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onResponse("accepted");
							}}
						>
							{tActions.accept}
						</Button>
					)}
					{["pending", "accepted"].includes(
						connection.connectStatus,
					) && (
						<Button
							variant="outline"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onResponse("rejected");
							}}
						>
							{tActions.reject}
						</Button>
					)}
				</div>
			</div>
		);
	}
};
