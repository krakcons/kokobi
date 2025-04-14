import { ConnectionType } from "@/types/connections";
import { Button } from "./ui/button";

export const ConnectionActions = ({
	onSubmit,
	connection,
}: {
	connection: ConnectionType;
	onSubmit: (connectionStatus: "accepted" | "rejected") => void;
}) => {
	if (connection.connectStatus !== "pending") {
		return null;
	}

	return (
		<div className="flex gap-2">
			<Button onClick={() => onSubmit("accepted")}>Accept</Button>
			<Button variant="outline" onClick={() => onSubmit("rejected")}>
				Reject
			</Button>
		</div>
	);
};
