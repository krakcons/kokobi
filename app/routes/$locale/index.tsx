import { buttonVariants } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

export const Route = createFileRoute("/$locale/")({
	component: Home,
});

function Home() {
	const t = useTranslations("Home");

	return (
		<main className="mx-auto w-full max-w-screen-xl">
			<div className="flex w-full flex-col items-start justify-center p-10 sm:p-20">
				<h1 className="flex flex-col gap-3 text-5xl sm:mb-0 sm:text-7xl">
					{t("title.1")}
					<span className="whitespace-nowrap text-green-400">{t("title.2")}</span>
				</h1>
				<div className="mt-6 flex sm:mt-12">
					<p>{t("description")}</p>
				</div>
				<Link
					to="/auth/google"
					className={buttonVariants({
						className: "mt-8 sm:mt-12",
					})}
				>
					{t("get-started")}
				</Link>
			</div>
		</main>
	);
}

export default Home;
