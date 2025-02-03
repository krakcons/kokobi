"use client";

import { locales } from "@/lib/locale";
import { Language } from "@/types/translations";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

const LanguageToggle = () => {
	const { locale } = useParams({
		from: "/$locale/",
	});
	const navigate = useNavigate();

	return (
		<Select
			onValueChange={(value: Language) => {
				navigate({
					replace: true,
					params: (prev) => ({
						...prev,
						locale: locale === "en" ? "fr" : "en",
					}),
					search: (prev) => ({ ...prev }),
				});
			}}
			defaultValue={locale}
		>
			<SelectTrigger className="w-[80px]">
				<SelectValue placeholder="Language" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{locales.map((locale) => (
						<SelectItem key={locale.label} value={locale.value}>
							{locale.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
};

export default LanguageToggle;
