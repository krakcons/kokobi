import {
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Team, TeamTranslation } from "@/types/team";
import { useLocale, useTranslations } from "@/lib/locale";
import { useMutation } from "@tanstack/react-query";
import { updateUserTeamFn } from "@/server/handlers/users.teams";
import { teamImageUrl } from "@/lib/file";
import type { UserToTeamType } from "@/types/connections";
import { ConnectionActions } from "../ConnectionActions";
import { orpc } from "@/server/client";

export const TeamSwitcher = ({
	tenantId,
	teamId,
	teams,
	type,
}: {
	tenantId?: string;
	teamId: string;
	teams: (UserToTeamType & { team: Team & TeamTranslation })[];
	type: "learner" | "admin";
}) => {
	const { isMobile } = useSidebar();
	const locale = useLocale();
	const navigate = useNavigate();
	const router = useRouter();
	const t = useTranslations("TeamSwitcher");

	const activeTeam = teams.find((t) => t.teamId === teamId)!.team;

	const { mutate: setTeam } = useMutation({
		mutationFn: updateUserTeamFn,
		onSuccess: () => {
			navigate({
				to: type === "learner" ? "/$locale/learner" : "/$locale/admin",
				params: { locale },
				reloadDocument: true,
			});
		},
	});
	const updateConnection = useMutation(
		orpc.connection.update.mutationOptions({
			onSuccess: () => {
				router.invalidate();
			},
		}),
	);

	if (tenantId) {
		return (
			<SidebarHeader className="flex flex-row items-center justify-between border-b">
				<div className="flex gap-2 justify-between items-center flex-wrap w-full p-2">
					<Avatar className="rounded-lg size-8">
						<AvatarImage
							src={teamImageUrl(activeTeam, "favicon")}
							className="rounded-lg"
						/>
						<AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
							{activeTeam?.name.toUpperCase()[0]}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 text-left text-sm leading-tight">
						{activeTeam?.name}
					</div>
				</div>
			</SidebarHeader>
		);
	}

	return (
		<SidebarHeader className="flex flex-row items-center justify-between border-b">
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<Avatar className="rounded-lg size-8">
									<AvatarImage
										src={teamImageUrl(
											activeTeam,
											"favicon",
										)}
										className="rounded-lg"
									/>
									<AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
										{activeTeam?.name.toUpperCase()[0]}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 text-left text-sm leading-tight">
									{activeTeam?.name}
								</div>
								<ChevronsUpDown className="ml-auto" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
							align="start"
							side={isMobile ? "bottom" : "right"}
							sideOffset={4}
						>
							<DropdownMenuLabel className="text-xs text-muted-foreground">
								{t.title}
							</DropdownMenuLabel>
							{teams
								.sort((a) =>
									a.connectStatus === "accepted" ? -1 : 1,
								)
								.filter(
									({ connectStatus }) =>
										connectStatus !== "rejected",
								)
								.map(({ team, ...connection }) => (
									<DropdownMenuItem
										key={team.id}
										onClick={(e) => {
											if (
												connection.connectStatus ===
												"accepted"
											) {
												setTeam({
													data: {
														teamId: team.id,
														type,
													},
												});
											} else {
												e.preventDefault();
											}
										}}
										className="gap-2 p-2"
									>
										<Avatar className="rounded-md size-8">
											<AvatarImage
												src={teamImageUrl(
													team,
													"favicon",
												)}
												className="rounded-md"
											/>
											<AvatarFallback className="rounded-md">
												{
													activeTeam?.name.toUpperCase()[0]
												}
											</AvatarFallback>
										</Avatar>
										<p className="truncate flex-1">
											{team.name}
										</p>
										<ConnectionActions
											className="ml-2"
											connection={connection}
											onSubmit={(status) => {
												updateConnection.mutate({
													senderType: "team",
													recipientType: "user",
													id: team.id,
													connectStatus: status,
												});
											}}
											hideOnSuccess
										/>
									</DropdownMenuItem>
								))}
							{type === "admin" && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="gap-2 p-2"
										asChild
									>
										<Link
											to="/$locale/create-team"
											params={{ locale }}
										>
											<div className="flex size-6 items-center justify-center rounded-md border bg-background">
												<Plus className="size-4" />
											</div>
											<div className="font-medium text-muted-foreground">
												{t.create}
											</div>
										</Link>
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarHeader>
	);
};
