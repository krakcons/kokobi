import { ConnectionType } from "@/types/connections";
import { Button } from "./ui/button";

export const ConnectionActions = ({
	onSubmit,
	connection,
}: {
	connection: ConnectionType;
	onSubmit: (connectionStatus: "accepted" | "rejected") => void;
}) => {
	return (
		<div className="flex gap-2">
			{["pending", "rejected"].includes(connection.connectStatus) && (
				<Button
					variant="outline"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onSubmit("accepted");
					}}
				>
					Accept
				</Button>
			)}
			{["pending", "accepted"].includes(connection.connectStatus) && (
				<Button
					variant="outline"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onSubmit("rejected");
					}}
				>
					Reject
				</Button>
			)}
		</div>
	);
};
