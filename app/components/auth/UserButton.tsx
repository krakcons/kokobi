import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuth } from "@/server/auth/actions";
import { redirect } from "@tanstack/react-router";
import { User as UserIcon } from "lucide-react";

const UserButton = async () => {
	const { user } = await getAuth();

	if (user === null) return redirect({ to: "/auth/google" });

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className="h-10 w-10 rounded-full" size="icon">
					<UserIcon size={20} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-xs leading-none text-muted-foreground">{user.email}</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link href="/dashboard">Dashboard</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/auth/signout">Sign out</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default UserButton;
