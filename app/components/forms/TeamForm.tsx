import { Button, buttonVariants } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TeamFormType, TeamFormSchema } from "@/types/team";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Label } from "../ui/label";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "../ui/collapsible";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

const CollapsibleWrapper = ({ children }: { children: React.ReactNode }) => {
	const [open, setOpen] = useState(false);
	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="group/collapsible -mt-4 mb-0"
		>
			<CollapsibleTrigger asChild>
				<Button variant="link" className="self-start -ml-3 mb-4">
					Other settings (optional)
					<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="space-y-8 mb-8">
				{children}
			</CollapsibleContent>
		</Collapsible>
	);
};

const BlankWrapper = ({ children }: { children: React.ReactNode }) => (
	<>{children}</>
);

export const TeamForm = ({
	defaultValues,
	collapsible,
	onSubmit,
}: {
	defaultValues?: TeamFormType;
	collapsible?: boolean;
	onSubmit: (values: TeamFormType) => void;
}) => {
	const form = useForm<TeamFormType>({
		resolver: zodResolver(TeamFormSchema),
		defaultValues,
	});

	const logo = form.watch("logo");
	const favicon = form.watch("favicon");

	const faviconUrl = favicon ? URL.createObjectURL(favicon).toString() : null;
	const logoUrl = logo ? URL.createObjectURL(logo).toString() : null;

	const Wrapper = collapsible ? CollapsibleWrapper : BlankWrapper;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Wrapper>
					<FormField
						control={form.control}
						name="logo"
						render={({
							field: { value, onChange, ...fieldProps },
						}) => (
							<FormItem className="flex justify-start">
								<FormLabel className="flex flex-col items-start">
									<Label className="mb-4">Logo</Label>
									{logoUrl ? (
										<img
											src={logoUrl}
											width={350}
											height={100}
											alt="Team Logo"
											className="rounded"
										/>
									) : (
										<div className="h-[100px] w-[350px] rounded bg-muted" />
									)}
									<div
										className={buttonVariants({
											variant: "secondary",
											className: "mt-4 cursor-pointer",
										})}
									>
										Change Logo
									</div>
									<p className="mt-2 text-xs text-muted-foreground">
										Suggested image size: 350px x 100px
									</p>
								</FormLabel>
								<FormControl>
									<Input
										{...fieldProps}
										placeholder="Logo"
										type="file"
										className="hidden"
										accept="image/*"
										onChange={(event) => {
											onChange(
												event.target.files &&
													event.target.files[0],
											);
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="favicon"
						render={({
							field: { value, onChange, ...fieldProps },
						}) => (
							<FormItem className="flex justify-start">
								<FormLabel className="flex flex-col items-start">
									<Label className="mb-4">Favicon</Label>
									{faviconUrl ? (
										<img
											src={faviconUrl}
											width={100}
											height={100}
											alt="Team Favicon"
											className="rounded"
										/>
									) : (
										<div className="h-[100px] w-[100px] rounded bg-muted" />
									)}
									<div
										className={buttonVariants({
											variant: "secondary",
											className: "mt-4 cursor-pointer",
										})}
									>
										Change Favicon
									</div>
									<p className="mt-2 text-xs text-muted-foreground">
										Suggested image size: 512px x 512px
									</p>
								</FormLabel>
								<FormControl>
									<Input
										{...fieldProps}
										placeholder="Favicon"
										type="file"
										className="hidden"
										accept="image/*"
										onChange={(event) => {
											onChange(
												event.target.files &&
													event.target.files[0],
											);
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</Wrapper>
				<Button type="submit">Submit</Button>
			</form>
		</Form>
	);
};
