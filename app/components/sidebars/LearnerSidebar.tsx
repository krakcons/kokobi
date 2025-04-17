import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	useSidebar,
} from "@/components/ui/sidebar";
import { Link, useRouter } from "@tanstack/react-router";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLocale } from "@/lib/locale";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Course, CourseTranslation } from "@/types/course";
import { useState } from "react";
import { Collection, CollectionTranslation } from "@/types/collections";
import { signOutFn } from "@/server/handlers/user";
import { Team, TeamTranslation } from "@/types/team";
import { useServerFn } from "@tanstack/react-start";
import { UserToCollectionType, UserToCourseType } from "@/types/connections";
import { useMutation } from "@tanstack/react-query";
import { userConnectionResponseFn } from "@/server/handlers/connections";
import { ConnectionCollapsible } from "./ConnectionCollapsible";
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
							<SidebarMenuItem>
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
							<SidebarMenuItem>
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
