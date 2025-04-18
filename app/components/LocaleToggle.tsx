import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale";
import { useNavigate } from "@tanstack/react-router";

export const LocaleToggle = () => {
	const navigate = useNavigate();
	const locale = useLocale();

	console.log(locale);

	return (
		<Button
			onClick={() => {
				console.log("clicked");
				navigate({
					replace: true,
					to: ".",
					params: (prev: any) => ({
						...prev,
						locale: locale === "en" ? "fr" : "en",
					}),
					search: (s: any) => s,
				});
			}}
			size="icon"
		>
			{locale === "en" ? "FR" : "EN"}
		</Button>
	);
};
