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
	useSidebar,
} from "@/components/ui/sidebar";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLocale, useTranslations } from "@/lib/locale";
import { Book, LayoutDashboard, SquareLibrary } from "lucide-react";
import type { Course } from "@/types/course";
import type { Collection, CollectionTranslation } from "@/types/collections";
import type {
	UserToCollectionType,
	UserToCourseType,
} from "@/types/connections";
import { ConnectionStatusBadge } from "../ConnectionStatusBadge";
import { Separator } from "../ui/separator";
import type { Organization } from "@/types/organization";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import type { User } from "better-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/server/client";
import type { SessionWithImpersonatedBy } from "better-auth/plugins";
import { SidebarUserButton } from "./UserButton";

export const LearnerSidebar = ({
	tenantId,
	activeLearnerOrganizationId,
	organizations,
	courses,
	session,
	availableCourses,
	collections,
	user,
}: {
	tenantId?: string;
	activeLearnerOrganizationId: string;
	organizations: Organization[];
	courses: (UserToCourseType & { course: Course })[];
	availableCourses: Course[];
	collections: (UserToCollectionType & {
		collection: Collection &
			CollectionTranslation & {
				courses: Course[];
			};
	})[];
	session: SessionWithImpersonatedBy;
	user: User;
}) => {
	const { setOpenMobile } = useSidebar();
	const locale = useLocale();
	const t = useTranslations("LearnerSidebar");
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const updateOrganization = useMutation(
		orpc.learner.organization.setActive.mutationOptions({
			onSuccess: () =>
				navigate({
					to: "/$locale/learner",
					params: { locale },
				}).then(() => {
					queryClient.invalidateQueries();
				}),
		}),
	);

	return (
		<Sidebar className="list-none">
			<SidebarHeader>
				<OrganizationSwitcher
					tenantId={tenantId}
					activeOrganizationId={activeLearnerOrganizationId}
					organizations={organizations}
					invitations={[]}
					onSetActive={(organizationId) => {
						updateOrganization.mutate({
							id: organizationId,
						});
					}}
					hideCreate
				/>
			</SidebarHeader>
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
					<SidebarUserButton user={user} session={session} />
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
};
