import {
	SidebarFooter,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Theme, themes, useTheme } from "@/lib/theme";
import { signOutFn, updateUserFn } from "@/server/handlers/user";
import { useServerFn } from "@tanstack/react-start";
import type { User as UserType } from "@/types/users";
import {
	Blocks,
	Book,
	LogOutIcon,
	Moon,
	MoreVerticalIcon,
	Sun,
	SunMoon,
	User,
	UserCircleIcon,
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
import { useState } from "react";
import { UserForm } from "../forms/UserForm";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale";

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

export const UserButton = ({ user }: { user: UserType }) => {
	const { theme, setTheme } = useTheme();
	const { isMobile } = useSidebar();
	const [accountOpen, setAccountOpen] = useState(false);
	const signOut = useServerFn(signOutFn);
	const router = useRouter();
	const location = useLocation();
	const locale = useLocale();

	const learnerAdmin = location.pathname.startsWith(`/${locale}/learner`);

	const name =
		user.firstName && user.lastName
			? user.firstName + " " + user.lastName
			: null;
	const initials =
		user.firstName && user.lastName ? (
			user.firstName.charAt(0) + user.lastName.charAt(0)
		) : (
			<User className="size-4.5" />
		);

	const updateUser = useMutation({
		mutationFn: updateUserFn,
		onSuccess: () => {
			router.invalidate();
			setAccountOpen(false);
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
		<>
			<SidebarFooter>
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
									{name && (
										<span className="truncate font-medium">
											{name}
										</span>
									)}
									<span
										className={cn(
											"truncate text-xs",
											name && "text-muted-foreground",
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
										{name && (
											<span className="truncate font-medium">
												{name}
											</span>
										)}
										<span
											className={cn(
												"truncate text-xs",
												name && "text-muted-foreground",
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
									Theme (
									{theme.charAt(0).toUpperCase() +
										theme.slice(1)}
									)
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={() => setAccountOpen(true)}
								>
									<UserCircleIcon />
									Account
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										to={
											learnerAdmin
												? "/$locale/admin"
												: "/$locale/learner"
										}
										params={{ locale }}
									>
										{learnerAdmin ? (
											<>
												<Blocks />
												Switch to Admin
											</>
										) : (
											<>
												<Book />
												Switch to Learner
											</>
										)}
									</Link>
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem onSelect={() => signOut()}>
								<LogOutIcon />
								Sign out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarFooter>
			<Dialog open={accountOpen} onOpenChange={setAccountOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Account</DialogTitle>
						<DialogDescription>
							Manage your account settings.
						</DialogDescription>
					</DialogHeader>
					<UserForm
						defaultValues={{
							firstName: user.firstName ?? "",
							lastName: user.lastName ?? "",
						}}
						onSubmit={(data) =>
							updateUser.mutateAsync({
								data,
							})
						}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};
