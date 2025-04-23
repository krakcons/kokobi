import { ConnectionType } from "@/types/connections";
import { Button } from "@/components/ui/button";

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
	if (connection?.connectStatus === "accepted") {
		return children;
	}

	if (!connection || connection.connectType === "request") {
		if (connection) {
			if (connection.connectStatus === "rejected") {
				return <p>An admin has rejected your request to "{name}".</p>;
			} else {
				return (
					<p>
						Requested "{name}", please wait for an admin to approve.
					</p>
				);
			}
		} else {
			return (
				<div className="flex flex-col gap-4 sm:items-start">
					<p>Would you like to request access to "{name}"?</p>
					<Button onClick={onRequest}>Request Access</Button>
				</div>
			);
		}
	}

	if (connection.connectType === "invite") {
		return (
			<div className="flex flex-col gap-4">
				<p>You have been invited to "{name}".</p>
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
							Accept
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
							Reject
						</Button>
					)}
				</div>
			</div>
		);
	}
};
