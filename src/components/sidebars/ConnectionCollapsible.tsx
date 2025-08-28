import {
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Check, X } from "lucide-react";
import { useState } from "react";
import type { ConnectionType } from "@/types/connections";
import { ConnectionStatusBadge } from "../ConnectionStatusBadge";

export const ConnectionCollapsible = ({
	name,
	connectType,
	connectStatus,
	onSubmit,
}: {
	name: string;
	connectType: ConnectionType["connectType"];
	connectStatus: ConnectionType["connectStatus"];
	onSubmit: (connectionStatus: "accepted" | "rejected") => void;
}) => {
	const [open, setOpen] = useState(false);

	if (connectType === "request") {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton className="justify-between">
					<p className="truncate">{name}</p>
					<ConnectionStatusBadge
						connectStatus={connectStatus}
						connectType={connectType}
					/>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		<Collapsible asChild className="group/collapsible" open={open}>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton
						onClick={() => setOpen(!open)}
						className="h-auto"
					>
						<div className="flex gap-2 justify-between items-center flex-wrap w-full">
							<p className="truncate">{name}</p>
							<ConnectionStatusBadge
								connectStatus={connectStatus}
								connectType={connectType}
							/>
						</div>
						<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						<SidebarMenuSubButton
							onClick={() => {
								onSubmit("accepted");
							}}
						>
							<Check />
							Accept
						</SidebarMenuSubButton>
						<SidebarMenuSubButton
							onClick={() => {
								onSubmit("rejected");
							}}
						>
							<X />
							Reject
						</SidebarMenuSubButton>
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	);
};
