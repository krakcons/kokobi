import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Link, useNavigate } from "@tanstack/react-router";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "@/lib/locale";
import { authClient, authQueryOptions } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Check, ChevronsUpDown, Plus, X } from "lucide-react";
import type { Invitation, Organization } from "better-auth/plugins";
import { Button } from "../ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "../ui/badge";

const Invitation = ({
	invitation: { id: invitationId },
}: {
	invitation: Invitation;
}) => {
	const queryClient = useQueryClient();
	const { data: invitation } = useQuery(
		authQueryOptions.organization.getInvitation({ id: invitationId }),
	);

	if (!invitation) return null;

	const { data } = invitation;

	return (
		<DropdownMenuItem key={invitationId} className="gap-2 p-2">
			<p className="truncate flex-1">{data?.organizationName}</p>
			<Button
				onClick={() => {
					authClient.organization.acceptInvitation(
						{
							invitationId,
						},
						{
							onSuccess: () => {
								queryClient.invalidateQueries();
							},
						},
					);
				}}
				variant="outline"
				size="sm"
				className="w-6 h-6"
			>
				<Check className="size-4" />
			</Button>
			<Button
				onClick={() => {
					authClient.organization.rejectInvitation(
						{
							invitationId,
						},
						{
							onSuccess: () => {
								queryClient.invalidateQueries();
							},
						},
					);
				}}
				variant="outline"
				size="sm"
				className="w-6 h-6"
			>
				<X className="size-4" />
			</Button>
		</DropdownMenuItem>
	);
};

export const OrganizationSwitcher = ({
	organizations,
	invitations,
	activeOrganizationId,
}: {
	organizations: Organization[];
	invitations: Invitation[];
	activeOrganizationId: string;
}) => {
	const { isMobile } = useSidebar();
	const locale = useLocale();
	const navigate = useNavigate();
	const t = useTranslations("OrganizationSwitcher");
	const queryClient = useQueryClient();

	const organization = organizations.find(
		(organization) => organization.id === activeOrganizationId,
	);

	if (!organization) return null;

	return (
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
									src={organization?.logo ?? undefined}
									className="rounded-lg"
								/>
								<AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
									{organization?.name.toUpperCase()[0]}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 text-left text-sm leading-tight">
								{organization?.name}
							</div>
							{invitations.length > 0 && (
								<Badge variant="destructive">
									<Bell />
									{invitations.length}
								</Badge>
							)}
							<ChevronsUpDown />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							{t.title}
						</DropdownMenuLabel>
						{organizations?.map((organization) => (
							<DropdownMenuItem
								key={organization.id}
								onClick={() => {
									authClient.organization.setActive({
										organizationId: organization.id,
										fetchOptions: {
											onSuccess: () => {
												navigate({
													to: "/$locale/admin",
													params: { locale },
												}).then(() => {
													queryClient.invalidateQueries();
												});
											},
										},
									});
								}}
								className="gap-2 p-2"
							>
								<Avatar className="rounded-md size-8">
									<AvatarImage
										src={organization?.logo ?? undefined}
										className="rounded-md"
									/>
									<AvatarFallback className="rounded-md">
										{organization?.name.toUpperCase()[0]}
									</AvatarFallback>
								</Avatar>
								<p className="truncate flex-1">
									{organization?.name}
								</p>
							</DropdownMenuItem>
						))}
						{invitations.length > 0 && (
							<DropdownMenuLabel className="text-xs text-muted-foreground">
								Invitations ({invitations?.length ?? 0})
							</DropdownMenuLabel>
						)}
						{invitations?.map((invitation) => (
							<Invitation
								invitation={invitation}
								key={invitation.id}
							/>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem className="gap-2 p-2" asChild>
							<Link
								to="/$locale/auth/create-organization"
								params={{ locale }}
							>
								<div className="flex size-6 items-center justify-center rounded-md border bg-background">
									<Plus className="size-4" />
								</div>
								<div className="font-medium text-muted-foreground">
									{t.create}
								</div>
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
};
