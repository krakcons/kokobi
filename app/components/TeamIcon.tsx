import { env } from "@/env";
import { cn } from "@/lib/utils";

export const TeamIcon = ({
	src,
	className,
}: {
	src: string | null | undefined;
	className?: string;
}) => {
	if (!src) return null;
	return (
		<img
			src={`${env.VITE_SITE_URL}/cdn/${src}`}
			alt="Team Logo"
			className={cn("max-h-24 w-min p-2 border rounded-md", className)}
		/>
	);
};
