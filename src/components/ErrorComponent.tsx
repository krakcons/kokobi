import { useLocation, useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button, buttonVariants } from "./ui/button";
import { FloatingPage } from "./Page";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { ErrorSchema } from "@/server/lib/error";
import { useTranslations, getI18nFn } from "@/lib/locale";
import { useSuspenseQuery } from "@tanstack/react-query";

export const ErrorComponent = ({ error }: ErrorComponentProps) => {
	const router = useRouter();
	const location = useLocation();
	const { data: i18n } = useSuspenseQuery({
		queryKey: ["i18n", location.pathname],
		queryFn: getI18nFn,
	});
	const t = useTranslations("Errors", i18n);

	const errorContent = useMemo(() => {
		if (!error.message) return { title: t.title };
		const defaultErrorContent = {
			title: t.title,
			message: error.message,
			tryAgain: true,
		};
		try {
			const errorData = ErrorSchema.safeParse(JSON.parse(error.message));
			return errorData.success
				? {
						title: errorData.data.title,
						message: errorData.data.message,
						tryAgain: errorData.data.tryAgain ?? true,
					}
				: defaultErrorContent;
		} catch (e) {
			return defaultErrorContent;
		}
	}, [error, i18n, t]);

	return (
		<FloatingPage>
			<h1>{errorContent.title}</h1>
			<p>{errorContent.message}</p>
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
				{errorContent.tryAgain && (
					<Button
						onClick={() => {
							router.invalidate();
						}}
						variant="outline"
					>
						<RefreshCw />
						{t.tryAgain}
					</Button>
				)}
			</div>
		</FloatingPage>
	);
};
