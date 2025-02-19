import { cn } from "@/lib/utils";
import { useSidebar } from "./ui/sidebar";
import { Separator } from "./ui/separator";

export const Page = ({ children }: { children: React.ReactNode }) => {
	const { open, isMobile } = useSidebar();

	return (
		<div
			className={cn(
				"p-4",
				open && !isMobile
					? "max-w-[calc(100vw-16rem)]"
					: "max-w-screen",
			)}
		>
			{children}
		</div>
	);
};

export const PageHeader = ({
	title,
	description,
}: {
	title: string;
	description: string;
}) => (
	<div className="flex flex-col gap-2">
		<h1>{title}</h1>
		<p>{description}</p>
		<Separator className="mb-8 mt-2" />
	</div>
);
