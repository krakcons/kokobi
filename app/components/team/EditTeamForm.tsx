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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Label } from "../ui/label";

export const TeamForm = ({
	defaultValues,
	images,
	onSubmit,
}: {
	defaultValues?: TeamFormType;
	images?: {
		logo?: string;
		favicon?: string;
	};
	onSubmit: (values: TeamFormType) => void;
}) => {
	const [faviconUrl, setFaviconUrl] = useState<string | null>(
		images?.favicon ?? null,
	);
	const [logoUrl, setLogoUrl] = useState<string | null>(images?.logo ?? null);

	const form = useForm<TeamFormType>({
		resolver: zodResolver(TeamFormSchema),
		defaultValues,
	});

	return (
		<main>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className="flex flex-col items-start gap-8">
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
												className:
													"mt-4 cursor-pointer",
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
												if (event.target.files) {
													setLogoUrl(
														URL.createObjectURL(
															event.target
																.files[0]!,
														).toString(),
													);
												}
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
												className:
													"mt-4 cursor-pointer",
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
												if (event.target.files) {
													setFaviconUrl(
														URL.createObjectURL(
															event.target
																.files[0]!,
														).toString(),
													);
												}
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit">Submit</Button>
					</div>
				</form>
			</Form>
		</main>
	);
};
