import {
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Link, useRouter } from "@tanstack/react-router";
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
import { env } from "@/env";
import { Team, TeamTranslation } from "@/types/team";
import { useLocale } from "@/lib/locale";
import { useMutation } from "@tanstack/react-query";
import { setTeamFn } from "@/server/handlers/user";
import { teamImageUrl } from "@/lib/file";

export const TeamSwitcher = ({
	tenantId,
	teamId,
	teams,
	type,
}: {
	tenantId?: string;
	teamId: string;
	teams: (Team & TeamTranslation)[];
	type: "learner" | "admin";
}) => {
	const { isMobile } = useSidebar();
	const locale = useLocale();
	const router = useRouter();

	const activeTeam = teams.find((t) => t.id === teamId)!;

	const { mutate: setTeam } = useMutation({
		mutationFn: setTeamFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	return (
		<SidebarHeader className="flex flex-row items-center justify-between border-b">
			{tenantId ? (
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
			) : (
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
									Teams
								</DropdownMenuLabel>
								{teams.map((team) => (
									<DropdownMenuItem
										key={team.id}
										onClick={() => {
											setTeam({
												data: {
													teamId: team.id,
													type,
												},
											});
										}}
										className="gap-2 p-2"
									>
										<Avatar className="rounded-md size-6">
											<AvatarImage
												src={`${env.VITE_SITE_URL}/cdn/${team.id}/${team.locale}/favicon?updatedAt=${team.updatedAt.toString()}`}
												className="rounded-md"
											/>
											<AvatarFallback className="rounded-md">
												{
													activeTeam?.name.toUpperCase()[0]
												}
											</AvatarFallback>
										</Avatar>
										{team.name}
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
													Create team
												</div>
											</Link>
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			)}
		</SidebarHeader>
	);
};
