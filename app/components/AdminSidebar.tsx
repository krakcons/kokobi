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
	SidebarGroupAction,
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
import { Link, useMatch, useNavigate } from "@tanstack/react-router";
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
	Key,
	LayoutDashboard,
	LogOut,
	Plus,
	Settings,
	Users,
	Files,
	Book,
	FileBadge,
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
import { setTeamFn } from "@/server/handlers/user";
import { Team, TeamTranslation } from "@/types/team";

const CourseCollapsible = ({
	course,
}: {
	course: Course & CourseTranslation;
}) => {
	const { setOpenMobile } = useSidebar();
	const [open, setOpen] = useState(false);
	const locale = useLocale();

	// Match sub routes and open the collapsible if the route matches.
	const matchLearners = useMatch({
		from: "/$locale/admin/courses/$id/learners",
		shouldThrow: false,
	});
	const matchModules = useMatch({
		from: "/$locale/admin/courses/$id/modules",
		shouldThrow: false,
	});
	const matchSettings = useMatch({
		from: "/$locale/admin/courses/$id/settings",
		shouldThrow: false,
	});
	useEffect(() => {
		const matches = [matchLearners, matchModules, matchSettings];
		if (matches.some((match) => match && match.params.id === course.id)) {
			setOpen(true);
		}
	}, [matchLearners, matchModules, matchSettings]);

	return (
		<Collapsible
			key={course.id}
			asChild
			className="group/collapsible"
			open={open}
		>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton onClick={() => setOpen(!open)}>
						<p className="truncate">{course.name}</p>
						<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						<SidebarMenuSubItem>
							<Link
								to={"/$locale/admin/courses/$id/learners"}
								params={{
									locale,
									id: course.id,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuSubButton isActive={isActive}>
										<Users />
										Learners
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
						<SidebarMenuSubItem>
							<Link
								to={"/$locale/admin/courses/$id/modules"}
								params={{
									locale,
									id: course.id,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuSubButton isActive={isActive}>
										<Files />
										Modules
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
						<SidebarMenuSubItem>
							<Link
								to={"/$locale/admin/courses/$id/settings"}
								params={{
									locale,
									id: course.id,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuSubButton isActive={isActive}>
										<Settings />
										Settings
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	);
};

const CollectionCollapsible = ({
	collection,
}: {
	collection: Collection & CollectionTranslation;
}) => {
	const [open, setOpen] = useState(false);
	const locale = useLocale();
	const { setOpenMobile } = useSidebar();

	// Match sub routes and open the collapsible if the route matches.
	const matchLearners = useMatch({
		from: "/$locale/admin/collections/$id/learners",
		shouldThrow: false,
	});
	const matchCourses = useMatch({
		from: "/$locale/admin/collections/$id/courses",
		shouldThrow: false,
	});
	const matchSettings = useMatch({
		from: "/$locale/admin/collections/$id/settings",
		shouldThrow: false,
	});
	useEffect(() => {
		const matches = [matchLearners, matchCourses, matchSettings];
		if (
			matches.some((match) => match && match.params.id === collection.id)
		) {
			setOpen(true);
		}
	}, [matchLearners, matchCourses, matchSettings]);

	return (
		<Collapsible
			key={collection.id}
			asChild
			className="group/collapsible"
			open={open}
		>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton onClick={() => setOpen(!open)}>
						{collection.name}
						<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						<Link
							to={"/$locale/admin/collections/$id/learners"}
							params={{
								locale,
								id: collection.id,
							}}
							search={(p) => p}
							onClick={() => {
								setOpenMobile(false);
							}}
						>
							{({ isActive }) => (
								<SidebarMenuSubButton isActive={isActive}>
									<Users />
									Learners
								</SidebarMenuSubButton>
							)}
						</Link>
						<SidebarMenuSubItem>
							<Link
								to={"/$locale/admin/collections/$id/courses"}
								params={{
									locale,
									id: collection.id,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuSubButton isActive={isActive}>
										<Book />
										Courses
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
						<SidebarMenuSubItem>
							<Link
								to={"/$locale/admin/collections/$id/settings"}
								params={{
									locale,
									id: collection.id,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuSubButton isActive={isActive}>
										<Settings />
										Settings
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	);
};

export const AdminSidebar = ({
	teamId,
	teams,
	courses,
	collections,
}: {
	teamId: string;
	teams: (Team & TeamTranslation)[];
	courses: (Course & CourseTranslation)[];
	collections: (Collection & CollectionTranslation)[];
}) => {
	const { theme, setTheme } = useTheme();
	const { setOpenMobile, isMobile } = useSidebar();
	const t = useTranslations("Nav");
	const locale = useLocale();
	const navigate = useNavigate();

	const activeTeam = teams.find((t) => t.id === teamId);

	return (
		<Sidebar className="list-none">
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
											src={`${env.VITE_SITE_URL}/cdn/${activeTeam?.id}/${activeTeam?.locale}/favicon?updatedAt=${activeTeam?.updatedAt.toString()}`}
											className="rounded-lg"
										/>
										<AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
											{activeTeam?.name.toUpperCase()[0]}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
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
										onClick={async () => {
											await setTeamFn({
												data: {
													teamId: team.id,
												},
											});
											navigate({
												to: "/$locale/admin",
												params: { locale },
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
								<DropdownMenuSeparator />
								<DropdownMenuItem className="gap-2 p-2" asChild>
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
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>
							{t.sidebar.manage}
						</SidebarGroupLabel>
						<SidebarMenuItem>
							<Link
								to="/$locale/admin"
								params={{
									locale,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
								activeOptions={{ exact: true }}
							>
								{({ isActive }) => (
									<SidebarMenuButton isActive={isActive}>
										<LayoutDashboard />
										{t.sidebar.dashboard}
									</SidebarMenuButton>
								)}
							</Link>
						</SidebarMenuItem>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>Courses</SidebarGroupLabel>
						<SidebarGroupAction title="Create Course" asChild>
							<Link
								to="/$locale/admin/courses/create"
								params={{
									locale,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								<Plus />{" "}
								<span className="sr-only">Create Course</span>
							</Link>
						</SidebarGroupAction>
						{courses.map((course) => (
							<CourseCollapsible
								course={course}
								key={course.id}
							/>
						))}
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>Collections</SidebarGroupLabel>
						<SidebarGroupAction title="Create Collection" asChild>
							<Link
								to="/$locale/admin/collections/create"
								params={{
									locale,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								<Plus />{" "}
								<span className="sr-only">
									Create Collection
								</span>
							</Link>
						</SidebarGroupAction>
						{collections.map((collection) => (
							<CollectionCollapsible
								collection={collection}
								key={collection.id}
							/>
						))}
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>{t.sidebar.team}</SidebarGroupLabel>
						<SidebarMenuItem>
							<Link
								to="/$locale/admin/keys"
								params={{
									locale,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuButton isActive={isActive}>
										<Key />
										{t.sidebar.apiKeys}
									</SidebarMenuButton>
								)}
							</Link>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<Link
								to="/$locale/admin/certificate"
								params={{
									locale,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuButton isActive={isActive}>
										<FileBadge />
										{t.sidebar.certificate}
									</SidebarMenuButton>
								)}
							</Link>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<Link
								to="/$locale/admin/members"
								params={{
									locale,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuButton isActive={isActive}>
										<Users />
										{t.sidebar.members}
									</SidebarMenuButton>
								)}
							</Link>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<Link
								to="/$locale/admin/settings"
								params={{
									locale,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuButton isActive={isActive}>
										<Settings />
										Settings
									</SidebarMenuButton>
								)}
							</Link>
						</SidebarMenuItem>
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
					<a href={env.VITE_SITE_URL + "/api/auth/signout"}>
						<SidebarMenuButton>
							<LogOut />
							Sign out
						</SidebarMenuButton>
					</a>
				</SidebarMenuItem>
			</SidebarFooter>
		</Sidebar>
	);
};
