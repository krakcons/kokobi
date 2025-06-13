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
			src={src}
			alt="Team Logo"
			className={cn("max-h-20 w-min", className)}
		/>
	);
};
