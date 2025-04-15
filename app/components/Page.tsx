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
	children,
}: {
	title: string;
	description: string;
	children?: React.ReactNode;
}) => (
	<div className="flex flex-col gap-2">
		<div className="flex items-end justify-between flex-wrap gap-2">
			<div className="flex flex-col gap-2">
				<h1>{title}</h1>
				<p>{description}</p>
			</div>
			{children}
		</div>
		<Separator className="mt-2 mb-4" />
	</div>
);

export const PageSubHeader = ({
	title,
	description,
	children,
	className,
}: {
	title: string;
	description?: string;
	children?: React.ReactNode;
	className?: string;
}) => (
	<div
		className={cn(
			"flex items-end justify-between flex-wrap gap-2",
			className,
		)}
	>
		<div className="flex flex-col gap-2">
			<h3>{title}</h3>
			{description && <p>{description}</p>}
		</div>
		{children}
	</div>
);

export const FloatingPage = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<div
			className={cn(
				"min-h-screen max-w-screen w-full flex flex-col items-center justify-center p-4 sm:p-8",
				className,
			)}
		>
			{children}
		</div>
	);
};
