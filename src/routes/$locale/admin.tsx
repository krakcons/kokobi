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
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { client, queryOptions, useMutationOptions } from "@/lib/api";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLocale, useTranslations } from "@/lib/locale";
import {
	ChevronRight,
	ChevronsUpDown,
	Key,
	LayoutDashboard,
	LogOut,
	Plus,
	Settings,
	Users,
	Files,
	Book,
	FileBadge,
	Moon,
	Sun,
	SunMoon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Theme, useTheme } from "@/lib/theme";
import { LanguageToggle } from "@/components/LanguageToggle";
import { z } from "zod";
import { env } from "@/env";

export const Route = createFileRoute("/$locale/admin")({
	component: RouteComponent,
	validateSearch: z.object({
		locale: LocaleSchema.optional(),
	}),
	beforeLoad: async ({ context: { queryClient } }) => {
		const { user } = await queryClient.ensureQueryData(
			queryOptions.user.me,
		);

		if (!user) {
			throw redirect({
				href: env.VITE_API_URL + "/api/auth/google",
			});
		}

		const { locale, teamId } = await queryClient.ensureQueryData(
			queryOptions.user.preferences,
		);

		if (!teamId) {
			throw redirect({
				to: "/$locale/create-team",
				params: {
					locale,
				},
			});
		}
	},
	loader: async ({ context: { queryClient } }) => {
		Promise.all([
			queryClient.ensureQueryData(queryOptions.user.teams),
			queryClient.ensureQueryData(queryOptions.courses.all),
			queryClient.ensureQueryData(queryOptions.collections.all),
		]);
	},
});

const AdminSidebar = () => {
	const { theme, setTheme } = useTheme();
	const { setOpenMobile, isMobile } = useSidebar();
	const t = useTranslations("Nav");
	const locale = useLocale();
	const navigate = Route.useNavigate();
	const {
		data: { teamId },
	} = useSuspenseQuery(queryOptions.user.me);
	const { data: teams } = useSuspenseQuery(queryOptions.user.teams);
	const { data: courses } = useSuspenseQuery(queryOptions.courses.all);
	const { data: collections } = useSuspenseQuery(
		queryOptions.collections.all,
	);

	const mutationOptions = useMutationOptions();
	const updatePreferences = useMutation(mutationOptions.user.preferences);

	const activeTeam = teams.find((t) => t.id === teamId);

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
									<Avatar className="rounded-lg size-8">
										<AvatarImage
											src={`${env.VITE_API_URL}/cdn/${activeTeam?.id}/${activeTeam?.language}/favicon?updatedAt=${activeTeam?.updatedAt.toString()}`}
											className="rounded-lg"
										/>
										<AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
											{activeTeam?.name.toUpperCase()[0]}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										{activeTeam?.name}
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
								{teams.map((team) => (
									<DropdownMenuItem
										key={team.id}
										onClick={() => {
											updatePreferences.mutate(
												{
													json: {
														teamId: team.id,
													},
												},
												{
													onSuccess: () => {
														navigate({
															to: "/$locale/admin",
														});
													},
												},
											);
										}}
										className="gap-2 p-2"
									>
										<Avatar className="rounded-md size-6">
											<AvatarImage
												src={`${env.VITE_API_URL}/cdn/${team.id}/${team.language}/favicon?updatedAt=${team.updatedAt.toString()}`}
												className="rounded-md"
											/>
											<AvatarFallback className="rounded-md">
												{
													activeTeam?.name.toUpperCase()[0]
												}
											</AvatarFallback>
										</Avatar>
										{team.name}
									</DropdownMenuItem>
								))}
								<DropdownMenuSeparator />
								<DropdownMenuItem className="gap-2 p-2" asChild>
									<Link
										to="/$locale/create-team"
										params={{ locale }}
									>
										<div className="flex size-6 items-center justify-center rounded-md border bg-background">
											<Plus className="size-4" />
										</div>
										<div className="font-medium text-muted-foreground">
											Create team
										</div>
									</Link>
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
							{t.sidebar.manage}
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
									{t.sidebar.dashboard}
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
											<p className="truncate">
												{course.name}
											</p>
											<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
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
											{/* <SidebarMenuSubItem>
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
											</SidebarMenuSubItem> */}
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
											<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
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
						<SidebarGroupLabel>{t.sidebar.team}</SidebarGroupLabel>
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
									{t.sidebar.apiKeys}
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
									{t.sidebar.certificate}
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
									{t.sidebar.members}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
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
									<Settings />
									Settings
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenuItem>
					<SidebarMenuButton asChild>
						<Select
							value={theme}
							onValueChange={(value: Theme) => {
								setTheme(value);
							}}
						>
							<SelectTrigger>
								<p className="font-medium">Theme</p>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="light">
									<Sun />
									Light
								</SelectItem>
								<SelectItem value="dark">
									<Moon />
									Dark
								</SelectItem>
								<SelectItem value="system">
									<SunMoon />
									System
								</SelectItem>
							</SelectContent>
						</Select>
					</SidebarMenuButton>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton asChild>
						<a href={env.VITE_API_URL + "/api/auth/signout"}>
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
	const t = useTranslations("Nav");
	const userLocale = useLocale();
	const { locale } = useSearch({
		from: "/$locale/admin",
	});
	const navigate = useNavigate();

	const editingLocale = locale ?? userLocale;

	return (
		<SidebarProvider>
			<AdminSidebar />
			<SidebarInset>
				<header className="p-4 flex flex-row items-center justify-between">
					<SidebarTrigger />
					<div className="flex flex-row items-center gap-2">
						<Select
							value={editingLocale}
							onValueChange={(value) => {
								navigate({
									// @ts-ignore
									search: (s) => ({
										...s,
										locale: value as Locale,
									}),
								});
							}}
						>
							<SelectTrigger className="gap-1">
								<p className="text-sm text-muted-foreground">
									{t.top.editing}
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
						<LanguageToggle />
					</div>
				</header>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
