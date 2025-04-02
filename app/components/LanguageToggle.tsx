import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export const LanguageToggle = () => {
	const navigate = useNavigate();
	const locale = useLocale();
	const queryClient = useQueryClient();
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
				}).then(() => {
					queryClient.invalidateQueries();
				});
			}}
			size="icon"
		>
			{locale === "en" ? "FR" : "EN"}
		</Button>
	);
};
