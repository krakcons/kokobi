"use client";

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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { env } from "@/env";
import { client } from "@/lib/api";
import { locales } from "@/lib/locale";
import { FileSchema } from "@/lib/module";
import { translate } from "@/lib/translation";
import { TeamTranslation, UpdateTeamTranslationSchema } from "@/types/team";
import { Language } from "@/types/translations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

const EditTeamFormSchema = UpdateTeamTranslationSchema.extend({
	logo: FileSchema.optional(),
	favicon: FileSchema.optional(),
});
type EditTeamForm = z.infer<typeof EditTeamFormSchema>;

export const EditTeamForm = ({
	translations,
	language,
	teamId,
}: {
	translations: TeamTranslation[];
	language: Language;
	teamId: string;
}) => {
	const router = useRouter();
	const defaultTeam = translate(translations, language);
	const [logoImageUrl, setLogoImageUrl] = useState<string | null>(
		defaultTeam.logo ? `${env.NEXT_PUBLIC_SITE_URL}/cdn/${defaultTeam.logo}` : null
	);
	const [faviconImageUrl, setFaviconImageUrl] = useState<string | null>(
		defaultTeam.favicon ? `${env.NEXT_PUBLIC_SITE_URL}/cdn/${defaultTeam.favicon}` : null
	);
	const form = useForm<EditTeamForm>({
		resolver: zodResolver(EditTeamFormSchema),
		defaultValues: {
			default: defaultTeam.default,
			language,
			name: defaultTeam.name,
		},
	});

	const lang = form.watch("language");

	useEffect(() => {
		form.setValue(
			"name",
			translations.find((translation) => translation.language === lang)?.name || ""
		);
		const logo = translate(translations, lang).logo
			? `${env.NEXT_PUBLIC_SITE_URL}/cdn/${translate(translations, lang).logo}`
			: null;
		setLogoImageUrl(logo);
		const favicon = translate(translations, lang).favicon
			? `${env.NEXT_PUBLIC_SITE_URL}/cdn/${translate(translations, lang).favicon}`
			: null;
		setFaviconImageUrl(favicon);
	}, [lang, form, translations, defaultTeam.logo, defaultTeam.favicon]);

	const { mutate, isPending } = useMutation({
		mutationFn: async (values: EditTeamForm) => {
			let logoUrl: TeamTranslation["logo"] = null;
			if (values.logo) {
				const presignedRes = await client.api.teams.logo.$post({
					json: {
						language: values.language,
					},
				});
				const { url, imageUrl } = await presignedRes.json();
				const contentType = values.logo.type;

				await fetch(url, {
					method: "PUT",
					headers: contentType
						? new Headers({
								"Content-Type": contentType,
							})
						: undefined,
					body: values.logo,
				});
				logoUrl = imageUrl + "?" + Date.now();
			}

			let faviconUrl: TeamTranslation["favicon"] = null;
			if (values.favicon) {
				const presignedRes = await client.api.teams.favicon.$post({
					json: {
						language: values.language,
					},
				});
				const { url, imageUrl } = await presignedRes.json();
				const contentType = values.favicon.type;

				await fetch(url, {
					method: "PUT",
					headers: contentType
						? new Headers({
								"Content-Type": contentType,
							})
						: undefined,
					body: values.favicon,
				});
				faviconUrl = imageUrl + "?" + Date.now();
			}

			const currentLogo = translate(translations, values.language).logo;
			const currentFavicon = translate(translations, values.language).favicon;
			return client.api.teams[":id"].$put({
				param: { id: teamId },
				json: {
					...values,
					logo: logoUrl ?? currentLogo,
					favicon: faviconUrl ?? currentFavicon,
				},
			});
		},
		onSuccess: () => {
			router.invalidate();
			toast("Team updated successfully");
		},
	});

	// 2. Define a submit handler.
	const onSubmit = async (values: EditTeamForm) => {
		console.log(values);
		mutate(values);
	};

	return (
		<main>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className="flex items-center justify-between">
						<div>
							<h2>Edit Team</h2>
							<p className="text-muted-foreground">Edit team in multiple languages</p>
						</div>
						<FormField
							control={form.control}
							name="language"
							render={({ field }) => (
								<FormItem>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger className="w-[80px]">
												<SelectValue placeholder="Select language" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectGroup>
												{locales.map((locale) => (
													<SelectItem
														key={locale.label}
														value={locale.value}
													>
														{locale.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<Separator className="my-8" />
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
							render={({ field: { value, onChange, ...fieldProps } }) => (
								<FormItem className="flex justify-start">
									<FormLabel className="flex flex-col items-start">
										<Label className="mb-4">Logo</Label>
										{logoImageUrl ? (
											<img
												src={logoImageUrl}
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
													event.target.files && event.target.files[0]
												);
												if (event.target.files) {
													setLogoImageUrl(
														URL.createObjectURL(
															event.target.files[0]!
														).toString()
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
							render={({ field: { value, onChange, ...fieldProps } }) => (
								<FormItem className="flex justify-start">
									<FormLabel className="flex flex-col items-start">
										<Label className="mb-4">Favicon</Label>
										{faviconImageUrl ? (
											<img
												src={faviconImageUrl}
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
													event.target.files && event.target.files[0]
												);
												if (event.target.files) {
													setFaviconImageUrl(
														URL.createObjectURL(
															event.target.files[0]!
														).toString()
													);
												}
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" isPending={isPending}>
							Submit
						</Button>
					</div>
				</form>
			</Form>
		</main>
	);
};
