import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

function TeamAvatar({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			className={cn(
				"relative flex shrink-0 overflow-hidden rounded-md",
				className,
			)}
			{...props}
		/>
	);
}

function TeamAvatarImage({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
	return (
		<AvatarPrimitive.Image
			data-slot="avatar-image"
			className={cn("max-h-24 w-min p-2 border rounded-md", className)}
			{...props}
		/>
	);
}

function TeamAvatarFallback({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
	return (
		<AvatarPrimitive.Fallback
			data-slot="avatar-fallback"
			className={cn(
				"border flex size-full items-center justify-center rounded-full",
				className,
			)}
			{...props}
		/>
	);
}

export { TeamAvatar, TeamAvatarImage, TeamAvatarFallback };
