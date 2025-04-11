import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Link, useMatch, useRouter } from "@tanstack/react-router";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLocale, useTranslations } from "@/lib/locale";
import {
	ChevronRight,
	ChevronsUpDown,
	LogOut,
	Plus,
	Settings,
	Users,
	Book,
	Moon,
	Sun,
	SunMoon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Theme, useTheme } from "@/lib/theme";
import { env } from "@/env";
import { Course, CourseTranslation } from "@/types/course";
import { useEffect, useState } from "react";
import { Collection, CollectionTranslation } from "@/types/collections";
import { setTeamFn, signOutFn } from "@/server/handlers/user";
import { Team, TeamTranslation } from "@/types/team";
import { useServerFn } from "@tanstack/react-start";
import { UserToCollectionType, UserToCourseType } from "@/types/connections";
import { useMutation } from "@tanstack/react-query";
import { userConnectionResponseFn } from "@/server/handlers/connections";
import { ConnectionCollapsible } from "./ConnectionCollapsible";

const CourseCollapsible = ({
	connection,
}: {
	connection: UserToCourseType & { course: Course & CourseTranslation };
}) => {
	const { setOpenMobile } = useSidebar();
	const locale = useLocale();
	const course = connection.course;
	const router = useRouter();

	const connectionResponse = useMutation({
		mutationFn: userConnectionResponseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	if (connection.connectStatus !== "accepted") {
		return (
			<ConnectionCollapsible
				name={course.name}
				{...connection}
				onSubmit={(connectStatus) => {
					connectionResponse.mutate({
						data: {
							type: "course",
							teamId: connection.teamId,
							id: course.id,
							connectStatus,
						},
					});
				}}
			/>
		);
	}

	return (
		<SidebarMenuItem>
			<Link
				to="/$locale/learner/courses/$courseId"
				params={{
					locale,
					courseId: course.id,
				}}
				search={(p) => p}
				onClick={() => {
					setOpenMobile(false);
				}}
			>
				{({ isActive }) => (
					<SidebarMenuButton isActive={isActive}>
						{course.name}
					</SidebarMenuButton>
				)}
			</Link>
		</SidebarMenuItem>
	);
};

const CollectionCollapsible = ({
	connection,
}: {
	connection: UserToCollectionType & {
		collection: Collection &
			CollectionTranslation & {
				courses: (Course & CourseTranslation)[];
			};
	};
}) => {
	const [open, setOpen] = useState(false);
	const locale = useLocale();
	const collection = connection.collection;
	const { setOpenMobile } = useSidebar();
	const router = useRouter();

	const connectionResponse = useMutation({
		mutationFn: userConnectionResponseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	if (connection.connectStatus !== "accepted") {
		return (
			<ConnectionCollapsible
				name={collection.name}
				{...connection}
				onSubmit={(connectStatus) => {
					connectionResponse.mutate({
						data: {
							type: "collection",
							teamId: connection.teamId,
							id: collection.id,
							connectStatus,
						},
					});
				}}
			/>
		);
	}

	return (
		<Collapsible asChild className="group/collapsible" open={open}>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton onClick={() => setOpen(!open)}>
						{collection.name}
						<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{collection.courses.map((course) => (
							<Link
								to={"/$locale/learner/courses/$courseId"}
								params={{
									locale,
									courseId: course.id,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuSubButton isActive={isActive}>
										{course.name}
									</SidebarMenuSubButton>
								)}
							</Link>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	);
};

export const LearnerSidebar = ({
	tenantId,
	activeTeam,
	teams,
	courses,
	collections,
}: {
	tenantId?: string;
	activeTeam: Team & TeamTranslation;
	teams: (Team & TeamTranslation)[];
	courses: (UserToCourseType & { course: Course & CourseTranslation })[];
	collections: (UserToCollectionType & {
		collection: Collection &
			CollectionTranslation & {
				courses: (Course & CourseTranslation)[];
			};
	})[];
}) => {
	const { theme, setTheme } = useTheme();
	const { setOpenMobile, isMobile } = useSidebar();
	const t = useTranslations("Nav");
	const signOut = useServerFn(signOutFn);
	const router = useRouter();
	const { mutate: setTeam } = useMutation({
		mutationFn: setTeamFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

	return (
		<Sidebar className="list-none">
			<SidebarHeader className="flex flex-row items-center justify-between border-b">
				{tenantId ? (
					<div className="flex gap-2 justify-between items-center flex-wrap w-full p-2">
						<Avatar className="rounded-lg size-8">
							<AvatarImage
								src={`${env.VITE_SITE_URL}/cdn/${activeTeam?.id}/${activeTeam?.locale}/favicon?updatedAt=${activeTeam?.updatedAt.toString()}`}
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
												src={`${env.VITE_SITE_URL}/cdn/${activeTeam?.id}/${activeTeam?.locale}/favicon?updatedAt=${activeTeam?.updatedAt.toString()}`}
												className="rounded-lg"
											/>
											<AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
												{
													activeTeam?.name.toUpperCase()[0]
												}
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
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				)}
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>Courses</SidebarGroupLabel>
						{courses.map((connection) => (
							<CourseCollapsible
								connection={connection}
								key={connection.courseId}
							/>
						))}
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>Collections</SidebarGroupLabel>
						{collections.map((connection) => (
							<CollectionCollapsible
								connection={connection}
								key={connection.collectionId}
							/>
						))}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenuItem>
					<SidebarMenuButton asChild>
						<Select
							value={theme}
							onValueChange={(value: Theme) => {
								setTheme(value);
							}}
						>
							<SelectTrigger>
								<p className="font-medium">Theme</p>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="light">
									<Sun />
									Light
								</SelectItem>
								<SelectItem value="dark">
									<Moon />
									Dark
								</SelectItem>
								<SelectItem value="system">
									<SunMoon />
									System
								</SelectItem>
							</SelectContent>
						</Select>
					</SidebarMenuButton>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton onClick={() => signOut()}>
						<LogOut />
						Sign out
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarFooter>
		</Sidebar>
	);
};
