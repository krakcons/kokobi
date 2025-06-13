import { ConnectionType } from "@/types/connections";
import { Button } from "./ui/button";
import { Check, Trash } from "lucide-react";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { cn } from "@/lib/utils";

export const ConnectionActions = ({
	onSubmit,
	connection,
	hideOnSuccess,
	className,
}: {
	connection: ConnectionType;
	onSubmit: (connectionStatus: "accepted" | "rejected") => void;
	hideOnSuccess?: boolean;
	className?: string;
}) => {
	if (hideOnSuccess && connection.connectStatus === "accepted") {
		return null;
	}

	return (
		<div className={cn("flex gap-2", className)}>
			<ConnectionStatusBadge {...connection} />
			{["pending", "rejected"].includes(connection.connectStatus) && (
				<Button
					variant="outline"
					size="icon"
					className="min-w-6 w-6 h-6"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onSubmit("accepted");
					}}
				>
					<Check />
				</Button>
			)}
			{["pending", "accepted"].includes(connection.connectStatus) && (
				<Button
					variant="outline"
					size="icon"
					className="min-w-6 w-6 h-6"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onSubmit("rejected");
					}}
				>
					<Trash className="size-3.5" />
				</Button>
			)}
		</div>
	);
};
