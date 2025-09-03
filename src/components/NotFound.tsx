import { useTranslations, getI18nFn } from "@/lib/locale";
import { FloatingPage } from "./Page";
import { Button, buttonVariants } from "./ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";

export function NotFound() {
	const { data: i18n } = useSuspenseQuery({
		queryKey: ["i18n"],
		queryFn: getI18nFn,
	});
	const t = useTranslations("Errors", i18n);

	return (
		<FloatingPage localeToggle={false}>
			<h1 className="text-7xl font-black">{t.NotFound.title}</h1>
			<p>{t.NotFound.message}</p>
			<div className="flex flex-row gap-2">
				<Button
					className={buttonVariants()}
					onClick={(e) => {
						e.preventDefault();
						window.history.back();
					}}
				>
					<ArrowLeft />
					{t.goBack}
				</Button>
				<a
					href="/"
					className={buttonVariants({
						variant: "outline",
					})}
				>
					<Home />
					{t.NotFound.home}
				</a>
			</div>
		</FloatingPage>
	);
}
