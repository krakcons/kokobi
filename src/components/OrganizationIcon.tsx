import { cn } from "@/lib/utils";

export const OrganizationIcon = ({
	src,
	className,
}: {
	src: string | null | undefined;
	className?: string;
}) => {
	if (!src) return null;
	return (
		<img
			src={src}
			alt="Organization logo"
			className={cn("max-h-20 w-min", className)}
		/>
	);
};
