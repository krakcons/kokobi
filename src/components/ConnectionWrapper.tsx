import { ConnectionType } from "@/types/connections";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/locale";
import { Check, X } from "lucide-react";

export const ConnectionWrapper = ({
	children,
	name,
	connection,
	allowRequest = true,
	onRequest,
	onResponse,
}: {
	children: React.ReactNode;
	name: string;
	connection?: ConnectionType;
	allowRequest?: boolean;
	onRequest: () => void;
	onResponse: (status: "accepted" | "rejected") => void;
}) => {
	const t = useTranslations("ConnectionWrapper");
	const tActions = useTranslations("ConnectionActions");
	const tTypes = useTranslations("ConnectionTypes");
	if (connection?.connectStatus === "accepted") {
		return children;
	}

	if ((!connection || connection.connectType === "request") && allowRequest) {
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

	if (connection?.connectType === "invite") {
		return (
			<div className="flex flex-col gap-4">
				<p>
					{connection.connectStatus === "rejected"
						? connection.connectType === "invite"
							? t.rejected
							: t.adminRejected
						: t.invited}{" "}
					"{name}"
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
							<Check />
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
							<X />
							{tActions.reject}
						</Button>
					)}
				</div>
			</div>
		);
	}

	return children;
};
