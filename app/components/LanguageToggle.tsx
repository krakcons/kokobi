import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export const LanguageToggle = () => {
	const navigate = useNavigate({
		from: "/$locale",
	});
	const locale = useLocale();
	const queryClient = useQueryClient();
	return (
		<Button
			onClick={() => {
				navigate({
					replace: true,
					params: (prev) => ({
						...prev,
						locale: locale === "en" ? "fr" : "en",
					}),
					search: (p) => p,
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
