import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { useLocale, useTranslations } from "@/lib/locale";
import { Book, LayoutDashboard, SquareLibrary } from "lucide-react";
import type { Course } from "@/types/course";
import type { Collection, CollectionTranslation } from "@/types/collections";
import type { Team, TeamTranslation } from "@/types/team";
import type {
	UserToCollectionType,
	UserToCourseType,
	UserToTeamType,
} from "@/types/connections";
import { TeamSwitcher } from "./TeamSwitcher";
import type { User } from "@/types/users";
import { AdminUserButton } from "./UserButton";
import { ConnectionStatusBadge } from "../ConnectionStatusBadge";
import { Separator } from "../ui/separator";

export const LearnerSidebar = ({
	tenantId,
	teamId,
	teams,
	courses,
	availableCourses,
	collections,
	user,
}: {
	tenantId?: string;
	teamId: string;
	teams: (UserToTeamType & { team: Team & TeamTranslation })[];
	courses: (UserToCourseType & { course: Course })[];
	availableCourses: Course[];
	collections: (UserToCollectionType & {
		collection: Collection &
			CollectionTranslation & {
				courses: Course[];
			};
	})[];
	user: User;
}) => {
	const { setOpenMobile } = useSidebar();
	const locale = useLocale();
	const t = useTranslations("LearnerSidebar");

	return (
		<Sidebar className="list-none">
			<TeamSwitcher
				tenantId={tenantId}
				teamId={teamId}
				teams={teams}
				type="learner"
			/>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<Link
									to="/$locale/learner"
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
				{availableCourses.length > 0 && (
					<SidebarGroup>
						<SidebarGroupLabel>
							{t["available-courses"]}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{availableCourses.map((course) => (
									<SidebarMenuItem key={course.id}>
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
												<SidebarMenuButton
													isActive={isActive}
												>
													<Book />
													<p className="truncate flex-1">
														{course.name}
													</p>
												</SidebarMenuButton>
											)}
										</Link>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
				<SidebarGroup>
					<SidebarGroupLabel>{t.courses}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{courses.map((connection) => (
								<SidebarMenuItem key={connection.courseId}>
									<Link
										to="/$locale/learner/courses/$courseId"
										params={{
											locale,
											courseId: connection.course.id,
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
												<Book />
												<p className="truncate flex-1">
													{connection.course.name}
												</p>
												<ConnectionStatusBadge
													hideOnSuccess
													{...connection}
												/>
											</SidebarMenuButton>
										)}
									</Link>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>{t.collections}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{collections.map((connection) => (
								<SidebarMenuItem key={connection.collectionId}>
									<Link
										to="/$locale/learner/collections/$collectionId"
										params={{
											locale,
											collectionId:
												connection.collectionId,
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
												<SquareLibrary />
												<p className="truncate flex-1">
													{connection.collection.name}
												</p>
												<ConnectionStatusBadge
													hideOnSuccess
													{...connection}
												/>
											</SidebarMenuButton>
										)}
									</Link>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<Link to={"/$locale/admin"} params={{ locale }}>
							<SidebarMenuButton
								variant="outline"
								className="justify-center"
							>
								<LayoutDashboard />
								{t.switchToAdmin}
							</SidebarMenuButton>
						</Link>
					</SidebarMenuItem>
					<Separator className="my-2" />
					<AdminUserButton user={user} />
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
};
