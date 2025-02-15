import { Button, buttonVariants } from "@/components/ui/button";
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
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
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
	ChevronsUpDown,
	ExternalLink,
	FileBadge,
	Key,
	LayoutDashboard,
	Link2,
	Plus,
	Users,
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

export const Route = createFileRoute("/$locale/admin")({
	component: RouteComponent,
	validateSearch: z.object({
		editingLocale: LocaleSchema.optional(),
	}),
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

		await queryClient.ensureQueryData(queryOptions.user.teams);
		const { user } = await queryClient.ensureQueryData(
			queryOptions.user.me,
		);

		if (!user) {
			throw redirect({
				href: "/api/auth/google",
			});
		}
	},
});

const AdminSidebar = () => {
	const { setOpenMobile, isMobile } = useSidebar();
	const t = useTranslations("Nav");
	const locale = useLocale();
	const { data } = useSuspenseQuery(queryOptions.user.teams);

	if (!data) return null;

	const activeTeam = translate(data.activeTeam.translations, locale);

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
								{data.teams.map((team, index) => (
									<DropdownMenuItem
										key={
											translate(
												team.team.translations,
												locale,
											).teamId
										}
										onClick={() => {
											console.log(team);
										}}
										className="gap-2 p-2"
									>
										<div className="flex size-6 items-center justify-center rounded-sm border">
											T
										</div>
										{
											translate(
												team.team.translations,
												locale,
											).name
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
						<SidebarGroupLabel>
							{t("sidebar.team")}
						</SidebarGroupLabel>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
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
									<Key />
									{t("sidebar.apiKeys")}
								</Link>
							</SidebarMenuButton>
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
				<Link
					to="/$locale"
					params={{
						locale,
					}}
					className={buttonVariants()}
				>
					<ExternalLink />
					Exit to home
				</Link>
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
