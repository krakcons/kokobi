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
import { useLocale } from "@/lib/locale";
import { LayoutDashboard } from "lucide-react";
import { Course, CourseTranslation } from "@/types/course";
import { Collection, CollectionTranslation } from "@/types/collections";
import { Team, TeamTranslation } from "@/types/team";
import { UserToCollectionType, UserToCourseType } from "@/types/connections";
import { TeamSwitcher } from "./TeamSwitcher";
import { User } from "@/types/users";
import { UserButton } from "./UserButton";
import { ConnectionStatusBadge } from "../ConnectionStatusBadge";

export const LearnerSidebar = ({
	tenantId,
	teamId,
	teams,
	courses,
	collections,
	user,
}: {
	tenantId?: string;
	teamId: string;
	teams: (Team & TeamTranslation)[];
	courses: (UserToCourseType & { course: Course & CourseTranslation })[];
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
										Dashboard
									</SidebarMenuButton>
								)}
							</Link>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>Courses</SidebarGroupLabel>
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
											{connection.course.name}
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
						<SidebarGroupLabel>Collections</SidebarGroupLabel>
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
											{connection.collection.name}
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
