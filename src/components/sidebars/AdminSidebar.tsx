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
	Share,
	ChartNoAxesColumn,
	SquareLibrary,
	FileBadge2,
	ShieldUser,
} from "lucide-react";
import type { Course } from "@/types/course";
import { useEffect, useState } from "react";
import type { Collection, CollectionTranslation } from "@/types/collections";
import type { Organization } from "@/types/organization";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { SidebarUserButton } from "./UserButton";
import { Separator } from "../ui/separator";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import type {
	Invitation,
	SessionWithImpersonatedBy,
	UserWithRole,
} from "better-auth/plugins";
import { authClient } from "@/lib/auth.client";
import { useQueryClient } from "@tanstack/react-query";

const CourseCollapsible = ({ course }: { course: Course }) => {
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
								to="/$locale/admin/courses/$courseId/learners"
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

const SharedCourseCollapsible = ({ course }: { course: Required<Course> }) => {
	const { setOpenMobile } = useSidebar();
	const [open, setOpen] = useState(false);
	const locale = useLocale();
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

	if (course.connection.connectStatus !== "accepted") {
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
							connectStatus={course.connection.connectStatus}
							connectType={course.connection.connectType}
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
							connectStatus={course.connection.connectStatus}
							connectType={course.connection.connectType}
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
	activeOrganizationId,
	organizations,
	courses,
	collections,
	invitations,
	user,
	session,
	role,
}: {
	tenantId?: string;
	activeOrganizationId: string;
	organizations: Organization[];
	invitations: Invitation[];
	courses: Course[];
	collections: (Collection & CollectionTranslation)[];
	user: UserWithRole;
	session: SessionWithImpersonatedBy;
	role: string;
}) => {
	const { setOpenMobile } = useSidebar();
	const t = useTranslations("AdminSidebar");
	const locale = useLocale();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	return (
		<Sidebar className="list-none">
			<SidebarHeader>
				<OrganizationSwitcher
					tenantId={tenantId}
					activeOrganizationId={activeOrganizationId}
					organizations={organizations}
					invitations={invitations}
					onSetActive={(organizationId) => {
						authClient.organization.setActive({
							organizationId: organizationId,
							fetchOptions: {
								onSuccess: () => {
									navigate({
										to: "/$locale/admin",
										params: { locale },
									}).then(() => {
										queryClient.invalidateQueries();
									});
								},
							},
						});
					}}
				/>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
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
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
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
							<span className="sr-only">{t.createCourse}</span>
						</Link>
					</SidebarGroupAction>
					<SidebarGroupContent>
						<SidebarMenu>
							{courses.map((course) =>
								course.connection ? (
									<SharedCourseCollapsible
										course={{
											...course,
											connection: course.connection,
										}}
										key={course.id}
									/>
								) : (
									<CourseCollapsible
										course={course}
										key={course.id}
									/>
								),
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
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
					<SidebarGroupContent>
						<SidebarMenu>
							{collections.map((collection) => (
								<CollectionCollapsible
									collection={collection}
									key={collection.id}
								/>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				{role === "owner" && (
					<SidebarGroup>
						<SidebarGroupLabel>{t.organization}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<Link
										to="/$locale/admin/api-keys"
										params={{
											locale,
										}}
										search={(p) => p}
										onClick={() => {
											setOpenMobile(false);
										}}
									>
										{({ isActive }) => (
											<SidebarMenuButton
												isActive={isActive}
											>
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
											<SidebarMenuButton
												isActive={isActive}
											>
												<FileBadge2 />
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
											<SidebarMenuButton
												isActive={isActive}
											>
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
											<SidebarMenuButton
												isActive={isActive}
											>
												<Settings />
												{t.settings}
											</SidebarMenuButton>
										)}
									</Link>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
				{user.role === "admin" && (
					<SidebarGroup>
						<SidebarGroupLabel>Super Admin</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<Link
										to="/$locale/admin/super/users"
										params={{
											locale,
										}}
										search={(p) => p}
										onClick={() => {
											setOpenMobile(false);
										}}
									>
										{({ isActive }) => (
											<SidebarMenuButton
												isActive={isActive}
											>
												<ShieldUser />
												Users
											</SidebarMenuButton>
										)}
									</Link>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<Link to={"/$locale/learner"} params={{ locale }}>
							<SidebarMenuButton
								className="justify-center"
								variant="outline"
							>
								<Book />
								{t.switchToLearner}
							</SidebarMenuButton>
						</Link>
					</SidebarMenuItem>
					<Separator className="my-2" />
					<SidebarUserButton user={user} session={session} />
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
};
