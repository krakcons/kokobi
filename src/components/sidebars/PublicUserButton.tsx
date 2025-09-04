import { type Theme, themes, useTheme } from "@/lib/theme";
import { updateUserFn } from "@/server/handlers/users";
import { deleteAuthFn } from "@/server/handlers/auth";
import type { User as UserType } from "@/types/users";
import {
	LogOutIcon,
	Moon,
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
import { UserForm } from "../forms/UserForm";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/locale";
import { Button } from "../ui/button";

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

export const PublicUserButton = ({
	user,
	signOutRedirect,
}: {
	user: UserType | null;
	signOutRedirect?: string;
}) => {
	const { theme, setTheme } = useTheme();
	const router = useRouter();
	const { accountDialog = false } = useSearch({
		from: "__root__",
	});
	const navigate = useNavigate();
	const t = useTranslations("UserButton");
	const tUserForm = useTranslations("UserForm");

	const name = !user
		? ""
		: user.firstName && user.lastName
			? user.firstName + " " + user.lastName
			: null;
	const initials = !user ? (
		""
	) : user.firstName && user.lastName ? (
		user.firstName.charAt(0) + user.lastName.charAt(0)
	) : (
		<User className="size-4.5" />
	);

	const setAccountDialog = (open: boolean) =>
		navigate({
			to: ".",
			search: {
				accountDialog: open || undefined,
			},
		});

	const updateUser = useMutation({
		mutationFn: updateUserFn,
		onSuccess: () => {
			router.invalidate();
			setAccountDialog(false);
		},
	});

	const changeTheme = () =>
		setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);

	return !!user ? (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						size="md"
						className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<Avatar className="h-8 w-8 rounded-lg grayscale">
							<AvatarFallback className="rounded-lg">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							{name ? (
								<span className="truncate font-medium">
									{name}
								</span>
							) : (
								<span className={cn("truncate text-xs")}>
									{user.email}
								</span>
							)}
						</div>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
					side={"bottom"}
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
							{t.theme.label} ({t.theme[theme]})
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => setAccountDialog(true)}
						>
							<UserCircleIcon />
							{t.account}
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={() => {
							deleteAuthFn().then(() =>
								signOutRedirect
									? navigate({
											href: signOutRedirect,
											reloadDocument: true,
										})
									: navigate({
											to: "/$locale/auth/login",
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
	) : (
		<Button
			size="lg"
			className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
			onClick={() =>
				navigate({ to: "/$locale/auth/login", reloadDocument: true })
			}
		>
			<div className="grid flex-1 text-left text-sm leading-tight">
				{name && <span className="truncate font-medium">{name}</span>}
				<span
					className={cn(
						"truncate text-xs",
						name && "text-muted-foreground",
					)}
				>
					Sign In
				</span>
			</div>
		</Button>
	);
};
