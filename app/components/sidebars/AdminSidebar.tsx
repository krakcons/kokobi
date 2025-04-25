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
import { Link, useMatch, useRouter } from "@tanstack/react-router";
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
	Check,
	X,
	ChartNoAxesColumn,
} from "lucide-react";
import { Course, CourseTranslation } from "@/types/course";
import { useEffect, useState } from "react";
import { Collection, CollectionTranslation } from "@/types/collections";
import { Team, TeamTranslation } from "@/types/team";
import { TeamToCourseType, UserToTeamType } from "@/types/connections";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { teamConnectionResponseFn } from "@/server/handlers/connections";
import { useMutation } from "@tanstack/react-query";
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
										Learners
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
										Statistics
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
										Sharing
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

const SharedCourseCollapsible = ({
	connection,
}: {
	connection: TeamToCourseType & { course: Course & CourseTranslation };
}) => {
	const { setOpenMobile } = useSidebar();
	const [open, setOpen] = useState(false);
	const locale = useLocale();
	const course = connection.course;
	const router = useRouter();

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

	const connectionResponse = useMutation({
		mutationFn: teamConnectionResponseFn,
		onSuccess: () => {
			router.invalidate();
		},
	});

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
						<div className="flex gap-2 justify-between items-center flex-wrap w-full">
							<p className="truncate">{course.name}</p>
							<ConnectionStatusBadge
								connectStatus={connection.connectStatus}
								connectType={connection.connectType}
							/>
						</div>
						<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{connection.connectStatus === "accepted" ? (
							<>
								<SidebarMenuSubItem>
									<Link
										to={
											"/$locale/admin/courses/$courseId/learners"
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
											<SidebarMenuSubButton
												isActive={isActive}
											>
												<Users />
												Learners
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
											<SidebarMenuSubButton
												isActive={isActive}
											>
												<ChartNoAxesColumn />
												Statistics
											</SidebarMenuSubButton>
										)}
									</Link>
								</SidebarMenuSubItem>
							</>
						) : (
							<>
								<SidebarMenuSubButton
									onClick={() => {
										connectionResponse.mutate({
											data: {
												type: "to-team",
												id: course.id,
												toId: connection.fromTeamId,
												connectStatus: "accepted",
											},
										});
									}}
								>
									<Check />
									Accept
								</SidebarMenuSubButton>
								<SidebarMenuSubButton
									onClick={() => {
										connectionResponse.mutate({
											data: {
												type: "to-team",
												id: course.id,
												toId: connection.fromTeamId,
												connectStatus: "rejected",
											},
										});
									}}
								>
									<X />
									Reject
								</SidebarMenuSubButton>
							</>
						)}
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
						{collection.name}
						<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
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
									Learners
								</SidebarMenuSubButton>
							)}
						</Link>
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
										Courses
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
						<SidebarGroupLabel>Shared Courses</SidebarGroupLabel>
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
				{role === "owner" && (
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarGroupLabel>
								{t.sidebar.team}
							</SidebarGroupLabel>
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
				)}
			</SidebarContent>
			<UserButton user={user} />
		</Sidebar>
	);
};
