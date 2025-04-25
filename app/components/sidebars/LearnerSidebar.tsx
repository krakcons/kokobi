import {
	Sidebar,
	SidebarContent,
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
import { LayoutDashboard } from "lucide-react";
import { Course, CourseTranslation } from "@/types/course";
import { Collection, CollectionTranslation } from "@/types/collections";
import { Team, TeamTranslation } from "@/types/team";
import {
	UserToCollectionType,
	UserToCourseType,
	UserToTeamType,
} from "@/types/connections";
import { TeamSwitcher } from "./TeamSwitcher";
import { User } from "@/types/users";
import { UserButton } from "./UserButton";
import { ConnectionStatusBadge } from "../ConnectionStatusBadge";

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
	courses: (UserToCourseType & { course: Course & CourseTranslation })[];
	availableCourses: (Course & CourseTranslation)[];
	collections: (UserToCollectionType & {
		collection: Collection &
			CollectionTranslation & {
				courses: (Course & CourseTranslation)[];
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
				</SidebarGroup>
				{availableCourses.length > 0 && (
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarGroupLabel>
								{t["available-courses"]}
							</SidebarGroupLabel>
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
												className="justify-between"
											>
												<p className="truncate">
													{course.name}
												</p>
											</SidebarMenuButton>
										)}
									</Link>
								</SidebarMenuItem>
							))}
						</SidebarGroupContent>
					</SidebarGroup>
				)}
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>{t.courses}</SidebarGroupLabel>
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
											className="justify-between"
										>
											<p className="truncate">
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
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>{t.collections}</SidebarGroupLabel>
						{collections.map((connection) => (
							<SidebarMenuItem key={connection.collectionId}>
								<Link
									to="/$locale/learner/collections/$collectionId"
									params={{
										locale,
										collectionId: connection.collectionId,
									}}
									search={(p) => p}
									onClick={() => {
										setOpenMobile(false);
									}}
								>
									{({ isActive }) => (
										<SidebarMenuButton
											isActive={isActive}
											className="justify-between"
										>
											<p className="truncate">
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
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<UserButton user={user} />
		</Sidebar>
	);
};
