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
import {
	ChevronRight,
	LogOut,
	Moon,
	Sun,
	SunMoon,
	LayoutDashboard,
} from "lucide-react";
import { Theme, useTheme } from "@/lib/theme";
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
	const { theme, setTheme } = useTheme();
	const { setOpenMobile } = useSidebar();
	const signOut = useServerFn(signOutFn);
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
			<UserButton user={user} />
		</Sidebar>
	);
};
