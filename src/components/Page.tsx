import { cn } from "@/lib/utils";
import { LocaleToggle } from "./LocaleToggle";
import { Separator } from "./ui/separator";

export const Page = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className={cn("p-4 gap-4 flex w-full flex-col")}>{children}</div>
	);
};

export const PageHeader = ({
	title,
	titlesize = "lg",
	description,
	UnderTitle = null,
	children,
}: {
	title: string;
	titlesize?: "lg" | "md" | "sm";
	description: string;
	UnderTitle?: React.ReactNode;
	children?: React.ReactNode;
}) => {
	const titleSizeClass = {
		lg: "text-5xl font-bold",
		md: "text-2xl font-semibold",
		sm: "text-xl font-medium",
	}[titlesize];

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-end justify-between flex-wrap gap-2">
				<div className="flex flex-col gap-6">
					<p className={cn(titleSizeClass)}>{title}</p>
					{UnderTitle}
					{description && <p>{description}</p>}
				</div>
				{children}
			</div>
			<Separator className="mt-2 mb-4" />
		</div>
	);
};

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
	contentClassname,
	localeToggle = true,
}: {
	children: React.ReactNode;
	contentClassname?: string;
	className?: string;
	localeToggle?: boolean;
}) => {
	return (
		<div
			className={cn(
				"h-full min-h-[calc(90vh-80px)] max-w-screen w-full flex flex-col items-center justify-center",
				className,
			)}
		>
			<div
				className={cn(
					"flex flex-col gap-4 max-w-lg w-full",
					contentClassname,
				)}
			>
				{localeToggle && <LocaleToggle />}
				{children}
			</div>
		</div>
	);
};
