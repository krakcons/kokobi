import { buttonVariants } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslations } from "@/lib/locale";

export const Route = createFileRoute("/$locale/")({
	component: Home,
});

function Home() {
	const t = useTranslations("Home");

	return (
		<>
			<header className="border-b-elevation-4 flex h-14 w-full items-center justify-center border-b px-6">
				<nav className="flex w-full max-w-screen-lg items-center justify-end">
					<a
						href="/api/auth/google"
						className={buttonVariants({
							className: "mr-4",
						})}
					>
						{t["get-started"]}
					</a>
				</nav>
			</header>
			<main className="mx-auto w-full max-w-screen-xl">
				<div className="flex w-full flex-col items-start justify-center p-10 sm:p-20">
					<h1 className="flex flex-col gap-3 text-5xl sm:mb-0 sm:text-7xl">
						{t.title["1"]}
						<span className="whitespace-nowrap text-green-400">
							{t.title["2"]}
						</span>
					</h1>
					<div className="mt-6 flex sm:mt-12">
						<p>{t.description}</p>
					</div>
					<a
						href="/api/auth/google"
						className={buttonVariants({
							className: "mt-8 sm:mt-12",
						})}
					>
						{t["get-started"]}
					</a>
				</div>
			</main>
		</>
	);
}

export default Home;
