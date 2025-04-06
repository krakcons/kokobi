import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale";
import { useNavigate } from "@tanstack/react-router";

export const LocaleToggle = () => {
	const navigate = useNavigate();
	const locale = useLocale();

	return (
		<Button
			onClick={() => {
				navigate({
					replace: true,
					// @ts-ignore
					params: (prev) => ({
						...prev,
						locale: locale === "en" ? "fr" : "en",
					}),
					// @ts-ignore
					search: (s) => s,
				});
			}}
			size="icon"
		>
			{locale === "en" ? "FR" : "EN"}
		</Button>
	);
};
