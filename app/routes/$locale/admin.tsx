import { Button } from "@/components/ui/button";
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
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { Locale, locales, LocaleSchema } from "@/lib/locale";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import {
	Book,
	ChevronRight,
	ChevronsUpDown,
	Edit,
	FileBadge,
	Files,
	Key,
	LayoutDashboard,
	Link2,
	LogOut,
	Plus,
	Settings,
	Users,
	Webhook,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "use-intl";
import { z } from "zod";
import { queryOptions } from "@/lib/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { translate } from "@/lib/translation";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

export const Route = createFileRoute("/$locale/admin")({
	component: RouteComponent,
	validateSearch: z.object({
		editingLocale: LocaleSchema.optional(),
	}),
	beforeLoad: async ({ context: { queryClient } }) => {
		const { user } = await queryClient.ensureQueryData(
			queryOptions.user.me,
		);

		if (!user) {
			throw redirect({
				href: "/api/auth/google",
			});
		}
	},
	loaderDeps: ({ search: { editingLocale } }) => ({ editingLocale }),
	loader: async ({ deps, params, location, context: { queryClient } }) => {
		if (!deps.editingLocale) {
			throw redirect({
				to: location.pathname,
				search: (search) => ({
					...search,
					editingLocale: params.locale as Locale,
				}),
				params,
			});
		}
		Promise.all([
			queryClient.ensureQueryData(queryOptions.user.teams),
			queryClient.ensureQueryData(queryOptions.courses.all),
			queryClient.ensureQueryData(queryOptions.collections.all),
		]);
	},
});

const AdminSidebar = () => {
	const { setOpenMobile, isMobile } = useSidebar();
	const t = useTranslations("Nav");
	const locale = useLocale();
	const {
		data: { teamId },
	} = useSuspenseQuery(queryOptions.user.me);
	const { data: teams } = useSuspenseQuery(queryOptions.user.teams);
	const { data: courses } = useSuspenseQuery(queryOptions.courses.all);
	const { data: collections } = useSuspenseQuery(
		queryOptions.collections.all,
	);

	const activeTeam = translate(
		teams.find((t) => t.id === teamId)!.translations,
		locale,
	);

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
									{activeTeam.logo ? (
										<img
											src={activeTeam.logo!}
											className="size-4"
										/>
									) : (
										<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
											{activeTeam.name.toUpperCase()[0]}
										</div>
									)}
									<div className="grid flex-1 text-left text-sm leading-tight">
										{activeTeam.name}
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
								{teams.map((team, index) => (
									<DropdownMenuItem
										key={team.id}
										onClick={() => {
											console.log(team);
										}}
										className="gap-2 p-2"
									>
										<div className="flex size-6 items-center justify-center rounded-sm border">
											T
										</div>
										{
											translate(team.translations, locale)
												.name
										}
										<DropdownMenuShortcut>
											⌘{index + 1}
										</DropdownMenuShortcut>
									</DropdownMenuItem>
								))}
								<DropdownMenuSeparator />
								<DropdownMenuItem className="gap-2 p-2">
									<div className="flex size-6 items-center justify-center rounded-md border bg-background">
										<Plus className="size-4" />
									</div>
									<div className="font-medium text-muted-foreground">
										Add team
									</div>
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
							{t("sidebar.manage")}
						</SidebarGroupLabel>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link
									to="/$locale/admin"
									params={{
										locale,
									}}
									search={(p) => p}
									onClick={() => {
										setOpenMobile(false);
									}}
								>
									<LayoutDashboard />
									{t("sidebar.dashboard")}
								</Link>
							</SidebarMenuButton>
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
							<Collapsible
								key={course.id}
								asChild
								className="group/collapsible"
							>
								<SidebarMenuItem>
									<CollapsibleTrigger asChild>
										<SidebarMenuButton>
											{
												translate(
													course.translations,
													locale,
												).name
											}
											<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton asChild>
													<Link
														to={
															"/$locale/admin/courses/$id/edit"
														}
														params={{
															locale,
															id: course.id,
														}}
														search={(p) => p}
														onClick={() => {
															setOpenMobile(
																false,
															);
														}}
													>
														<Edit />
														Edit
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton asChild>
													<Link
														to={
															"/$locale/admin/courses/$id/learners"
														}
														params={{
															locale,
															id: course.id,
														}}
														search={(p) => p}
														onClick={() => {
															setOpenMobile(
																false,
															);
														}}
													>
														<Users />
														Learners
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton asChild>
													<Link
														to={
															"/$locale/admin/courses/$id/modules"
														}
														params={{
															locale,
															id: course.id,
														}}
														search={(p) => p}
														onClick={() => {
															setOpenMobile(
																false,
															);
														}}
													>
														<Files />
														Modules
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton asChild>
													<Link
														to={
															"/$locale/admin/courses/$id/webhooks"
														}
														params={{
															locale,
															id: course.id,
														}}
														search={(p) => p}
														onClick={() => {
															setOpenMobile(
																false,
															);
														}}
													>
														<Webhook />
														Webhooks
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton asChild>
													<Link
														to={
															"/$locale/admin/courses/$id/settings"
														}
														params={{
															locale,
															id: course.id,
														}}
														search={(p) => p}
														onClick={() => {
															setOpenMobile(
																false,
															);
														}}
													>
														<Settings />
														Settings
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
							</Collapsible>
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
							<Collapsible
								key={collection.id}
								asChild
								className="group/collapsible"
							>
								<SidebarMenuItem>
									<CollapsibleTrigger asChild>
										<SidebarMenuButton>
											{
												translate(
													collection.translations,
													locale,
												).name
											}
											<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton asChild>
													<Link
														to={
															"/$locale/admin/collections/$id/edit"
														}
														params={{
															locale,
															id: collection.id,
														}}
														search={(p) => p}
														onClick={() => {
															setOpenMobile(
																false,
															);
														}}
													>
														<Edit />
														Edit
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton asChild>
													<Link
														to={
															"/$locale/admin/collections/$id/courses"
														}
														params={{
															locale,
															id: collection.id,
														}}
														search={(p) => p}
														onClick={() => {
															setOpenMobile(
																false,
															);
														}}
													>
														<Book />
														Courses
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton asChild>
													<Link
														to={
															"/$locale/admin/collections/$id/settings"
														}
														params={{
															locale,
															id: collection.id,
														}}
														search={(p) => p}
														onClick={() => {
															setOpenMobile(
																false,
															);
														}}
													>
														<Settings />
														Settings
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
							</Collapsible>
						))}
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarGroupLabel>
							{t("sidebar.team")}
						</SidebarGroupLabel>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link
									to="/$locale/admin/team"
									params={{
										locale,
									}}
									search={(p) => p}
									onClick={() => {
										setOpenMobile(false);
									}}
								>
									<Edit />
									{t("sidebar.edit")}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
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
									<Key />
									{t("sidebar.apiKeys")}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
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
									<FileBadge />
									{t("sidebar.certificate")}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link
									to="/$locale/admin/domains"
									params={{
										locale,
									}}
									search={(p) => p}
									onClick={() => {
										setOpenMobile(false);
									}}
								>
									<Link2 />
									{t("sidebar.domains")}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
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
									<Users />
									{t("sidebar.members")}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenuItem>
					<SidebarMenuButton asChild>
						<a href="/api/auth/signout">
							<LogOut />
							Sign out
						</a>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarFooter>
		</Sidebar>
	);
};

function RouteComponent() {
	const { locale } = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const t = useTranslations("Nav");

	return (
		<SidebarProvider>
			<AdminSidebar />
			<SidebarInset>
				<header className="p-4 flex flex-row items-center justify-between">
					<SidebarTrigger />
					<div className="flex flex-row items-center gap-2">
						<Select
							value={search.editingLocale}
							onValueChange={(value) => {
								navigate({
									replace: true,
									search: (search) => ({
										...search,
										editingLocale: value as Locale,
									}),
								});
							}}
						>
							<SelectTrigger>
								<p className="text-sm text-muted-foreground">
									{t("top.editing")}
								</p>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{locales.map(({ label, value }) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							onClick={() => {
								navigate({
									replace: true,
									params: (prev) => ({
										...prev,
										locale: locale === "en" ? "fr" : "en",
									}),
									search: (prev) => ({ ...prev }),
								});
							}}
							size="icon"
							className="w-12"
						>
							{locale === "en" ? "FR" : "EN"}
						</Button>
					</div>
				</header>
				<div className="p-4 flex-1">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
