import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Link, useMatch } from "@tanstack/react-router";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLocale, useTranslations } from "@/lib/locale";
import {
	ChevronRight,
	Key,
	LayoutDashboard,
	Plus,
	Settings,
	Users,
	Files,
	Book,
	FileBadge,
	Share,
	ChartNoAxesColumn,
	SquareLibrary,
	Square,
} from "lucide-react";
import { Course, CourseTranslation } from "@/types/course";
import { useEffect, useState } from "react";
import { Collection, CollectionTranslation } from "@/types/collections";
import { Team, TeamTranslation } from "@/types/team";
import { TeamToCourseType, UserToTeamType } from "@/types/connections";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { TeamSwitcher } from "./TeamSwitcher";
import { User } from "@/types/users";
import { UserButton } from "./UserButton";
import { Role } from "@/types/team";

const CourseCollapsible = ({
	course,
}: {
	course: Course & CourseTranslation;
}) => {
	const { setOpenMobile } = useSidebar();
	const [open, setOpen] = useState(false);
	const locale = useLocale();
	const t = useTranslations("AdminSidebar");

	// Match sub routes and open the collapsible if the route matches.
	const matchLearners = useMatch({
		from: "/$locale/admin/courses/$courseId/learners",
		shouldThrow: false,
	});
	const matchModules = useMatch({
		from: "/$locale/admin/courses/$courseId/modules",
		shouldThrow: false,
	});
	const matchStatistics = useMatch({
		from: "/$locale/admin/courses/$courseId/statistics",
		shouldThrow: false,
	});
	const matchSettings = useMatch({
		from: "/$locale/admin/courses/$courseId/settings",
		shouldThrow: false,
	});
	useEffect(() => {
		const matches = [
			matchLearners,
			matchModules,
			matchSettings,
			matchStatistics,
		];
		if (
			matches.some(
				(match) => match && match.params.courseId === course.id,
			)
		) {
			setOpen(true);
		}
	}, [matchLearners, matchModules, matchSettings, matchStatistics]);

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
						<Book />
						<p className="truncate">{course.name}</p>
						<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						<SidebarMenuSubItem>
							<Link
								to={"/$locale/admin/courses/$courseId/learners"}
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
										<Users />
										{t.learners}
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
						<SidebarMenuSubItem>
							<Link
								to={"/$locale/admin/courses/$courseId/modules"}
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
										<Files />
										Modules
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
						<SidebarMenuSubItem>
							<Link
								to={
									"/$locale/admin/courses/$courseId/statistics"
								}
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
										<ChartNoAxesColumn />
										{t.statistics}
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
						<SidebarMenuSubItem>
							<Link
								to={"/$locale/admin/courses/$courseId/sharing"}
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
										<Share />
										{t.sharing}
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
						<SidebarMenuSubItem>
							<Link
								to={"/$locale/admin/courses/$courseId/settings"}
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
										<Settings />
										{t.settings}
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

const SharedCourseCollapsible = ({
	connection,
}: {
	connection: TeamToCourseType & { course: Course & CourseTranslation };
}) => {
	const { setOpenMobile } = useSidebar();
	const [open, setOpen] = useState(false);
	const locale = useLocale();
	const course = connection.course;
	const t = useTranslations("AdminSidebar");

	// Match sub routes and open the collapsible if the route matches.
	const matchLearners = useMatch({
		from: "/$locale/admin/courses/$courseId/learners",
		shouldThrow: false,
	});
	const matchStatistics = useMatch({
		from: "/$locale/admin/courses/$courseId/statistics",
		shouldThrow: false,
	});

	useEffect(() => {
		const matches = [matchLearners, matchStatistics];
		if (
			matches.some(
				(match) => match && match.params.courseId === course.id,
			)
		) {
			setOpen(true);
		}
	}, [matchLearners, matchStatistics]);

	if (connection.connectStatus !== "accepted") {
		return (
			<Link
				to={"/$locale/admin/courses/$courseId"}
				params={{
					locale,
					courseId: course.id,
				}}
				search={(p) => p}
				onClick={() => {
					setOpenMobile(false);
				}}
				activeOptions={{ exact: true }}
			>
				{({ isActive }) => (
					<SidebarMenuButton
						onClick={() => setOpen(!open)}
						className="h-auto"
						isActive={isActive}
					>
						<Book />
						<p className="truncate">{course.name}</p>
						<ConnectionStatusBadge
							connectStatus={connection.connectStatus}
							connectType={connection.connectType}
						/>
					</SidebarMenuButton>
				)}
			</Link>
		);
	}

	return (
		<Collapsible
			key={course.id}
			asChild
			className="group/collapsible"
			open={open}
		>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton
						onClick={() => setOpen(!open)}
						className="h-auto"
					>
						<Book />
						<p className="truncate">{course.name}</p>
						<ConnectionStatusBadge
							connectStatus={connection.connectStatus}
							connectType={connection.connectType}
							hideOnSuccess
						/>
						<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						<SidebarMenuSubItem>
							<Link
								to={"/$locale/admin/courses/$courseId/learners"}
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
										<Users />
										{t.learners}
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
						<SidebarMenuSubItem>
							<Link
								to={
									"/$locale/admin/courses/$courseId/statistics"
								}
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
										<ChartNoAxesColumn />
										{t.statistics}
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
	const t = useTranslations("AdminSidebar");

	// Match sub routes and open the collapsible if the route matches.
	const matchLearners = useMatch({
		from: "/$locale/admin/collections/$collectionId/learners",
		shouldThrow: false,
	});
	const matchCourses = useMatch({
		from: "/$locale/admin/collections/$collectionId/courses",
		shouldThrow: false,
	});
	const matchSettings = useMatch({
		from: "/$locale/admin/collections/$collectionId/settings",
		shouldThrow: false,
	});
	useEffect(() => {
		const matches = [matchLearners, matchCourses, matchSettings];
		if (
			matches.some(
				(match) => match && match.params.collectionId === collection.id,
			)
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
						<SquareLibrary />
						{collection.name}
						<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						<SidebarMenuSubItem>
							<Link
								to={
									"/$locale/admin/collections/$collectionId/learners"
								}
								params={{
									locale,
									collectionId: collection.id,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuSubButton isActive={isActive}>
										<Users />
										{t.learners}
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
						<SidebarMenuSubItem>
							<Link
								to={
									"/$locale/admin/collections/$collectionId/courses"
								}
								params={{
									locale,
									collectionId: collection.id,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuSubButton isActive={isActive}>
										<Book />
										{t.courses}
									</SidebarMenuSubButton>
								)}
							</Link>
						</SidebarMenuSubItem>
						<SidebarMenuSubItem>
							<Link
								to={
									"/$locale/admin/collections/$collectionId/settings"
								}
								params={{
									locale,
									collectionId: collection.id,
								}}
								search={(p) => p}
								onClick={() => {
									setOpenMobile(false);
								}}
							>
								{({ isActive }) => (
									<SidebarMenuSubButton isActive={isActive}>
										<Settings />
										{t.settings}
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
	tenantId,
	teamId,
	teams,
	courses,
	collections,
	connections,
	user,
	role,
}: {
	tenantId?: string;
	teamId: string;
	teams: (UserToTeamType & { team: Team & TeamTranslation })[];
	courses: (Course & CourseTranslation)[];
	collections: (Collection & CollectionTranslation)[];
	connections: (TeamToCourseType & {
		course: Course & CourseTranslation;
		team: Team & TeamTranslation;
	})[];
	teamConnections: (UserToTeamType & { team: Team & TeamTranslation })[];
	user: User;
	role: Role;
}) => {
	const { setOpenMobile } = useSidebar();
	const t = useTranslations("AdminSidebar");
	const locale = useLocale();

	return (
		<Sidebar className="list-none">
			<TeamSwitcher
				tenantId={tenantId}
				teamId={teamId}
				teams={teams}
				type="admin"
			/>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
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
										{t.dashboard}
									</SidebarMenuButton>
								)}
							</Link>
						</SidebarMenuItem>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>{t.courses}</SidebarGroupLabel>
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
								<span className="sr-only">
									{t.createCourse}
								</span>
							</Link>
						</SidebarGroupAction>
						{courses.map((course) => (
							<CourseCollapsible
								course={course}
								key={course.id}
							/>
						))}
						{connections.map((connection) => (
							<SharedCourseCollapsible
								connection={connection}
								key={connection.courseId}
							/>
						))}
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>{t.collections}</SidebarGroupLabel>
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
									{t.createCollection}
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
				{role === "owner" && (
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarGroupLabel>{t.team}</SidebarGroupLabel>
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
											{t.apiKeys}
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
											{t.certificate}
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
											{t.members}
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
											{t.settings}
										</SidebarMenuButton>
									)}
								</Link>
							</SidebarMenuItem>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>
			<UserButton user={user} />
		</Sidebar>
	);
};
