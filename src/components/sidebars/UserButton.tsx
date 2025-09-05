import {
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { type Theme, themes, useTheme } from "@/lib/theme";
import type { UserFormType } from "@/types/users";
import {
	LogOutIcon,
	Moon,
	MoreVerticalIcon,
	Sun,
	SunMoon,
	UserIcon,
	UserCircleIcon,
	UserMinus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { UserForm } from "../forms/UserForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/locale";
import { authClient } from "@/lib/auth.client";
import type { User } from "better-auth";
import { orpc } from "@/server/client";
import type { SessionWithImpersonatedBy } from "better-auth/plugins";

const ThemeIcon = ({ theme }: { theme: Theme }) => {
	switch (theme) {
		case "light":
			return <Sun />;
		case "dark":
			return <Moon />;
		case "system":
			return <SunMoon />;
	}
};

export const UserButton = ({
	user,
	session,
	signOutRedirect,
}: {
	user: User;
	session: SessionWithImpersonatedBy;
	signOutRedirect?: string;
}) => {
	const { theme, setTheme } = useTheme();
	const { isMobile } = useSidebar();
	const { accountDialog = false } = useSearch({
		from: "__root__",
	});
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const t = useTranslations("UserButton");
	const tUserForm = useTranslations("UserForm");

	const initials = user.name ? (
		user.name.charAt(0)
	) : (
		<UserIcon className="size-4.5" />
	);

	const setAccountDialog = (open: boolean) =>
		navigate({
			to: ".",
			search: {
				accountDialog: open || undefined,
			},
		});

	const updateUser = useMutation({
		mutationFn: (values: UserFormType) => authClient.updateUser(values),
		onSuccess: () => {
			queryClient.invalidateQueries(orpc.auth.session.queryOptions());
			setAccountDialog(false);
		},
	});

	const changeTheme = () => {
		const themeIndex = themes.indexOf(theme);
		if (themeIndex === themes.length - 1) {
			setTheme(themes[0]);
		} else {
			setTheme(themes[themeIndex + 1]);
		}
	};

	return (
		<SidebarMenuItem>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<SidebarMenuButton
						size="lg"
						className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<Avatar className="h-8 w-8 rounded-lg grayscale">
							<AvatarFallback className="rounded-lg">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							{user.name && (
								<span className="truncate font-medium">
									{user.name}
								</span>
							)}
							<span
								className={cn(
									"truncate text-xs",
									user.name && "text-muted-foreground",
								)}
							>
								{user.email}
							</span>
						</div>
						<MoreVerticalIcon className="ml-auto size-4" />
					</SidebarMenuButton>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
					side={isMobile ? "bottom" : "right"}
					align="end"
					sideOffset={4}
				>
					<DropdownMenuLabel className="p-0 font-normal">
						<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarFallback className="rounded-lg">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								{user.name && (
									<span className="truncate font-medium">
										{user.name}
									</span>
								)}
								<span
									className={cn(
										"truncate text-xs",
										user.name && "text-muted-foreground",
									)}
								>
									{user.email}
								</span>
							</div>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault();
								changeTheme();
							}}
						>
							<ThemeIcon theme={theme} />
							{t.theme.label} ({t.theme[theme]})
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => setAccountDialog(true)}
						>
							<UserCircleIcon />
							{t.account}
						</DropdownMenuItem>
						{session.impersonatedBy && (
							<DropdownMenuItem
								onSelect={() => {
									authClient.admin
										.stopImpersonating()
										.then(() =>
											navigate({
												href: "/admin",
												reloadDocument: true,
											}),
										);
								}}
							>
								<UserMinus />
								Stop Impersonating
							</DropdownMenuItem>
						)}
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={() => {
							authClient.signOut().then(() =>
								signOutRedirect
									? navigate({
											href: signOutRedirect,
											reloadDocument: true,
										})
									: navigate({
											href: "/auth/login",
											reloadDocument: true,
										}),
							);
						}}
					>
						<LogOutIcon />
						{t.signout}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog
				open={accountDialog}
				onOpenChange={(open) => setAccountDialog(open)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{tUserForm.title}</DialogTitle>
						<DialogDescription>
							{tUserForm.description}
						</DialogDescription>
					</DialogHeader>
					<UserForm
						defaultValues={{
							name: user.name,
						}}
						onSubmit={(data) => updateUser.mutateAsync(data)}
					/>
				</DialogContent>
			</Dialog>
		</SidebarMenuItem>
	);
};
