import { cn } from "@/lib/utils";
import { useSidebar } from "./ui/sidebar";
import { Separator } from "./ui/separator";

export const Page = ({ children }: { children: React.ReactNode }) => {
	const { open, isMobile } = useSidebar();

	return (
		<div
			className={cn(
				"p-4 gap-4 flex flex-col",
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
		<Separator className="mt-2 mb-4" />
	</div>
);

export const PageSubHeader = ({
	title,
	description,
}: {
	title: string;
	description: string;
}) => (
	<div className="flex flex-col gap-2">
		<h3>{title}</h3>
		<p>{description}</p>
	</div>
);
