import { Link } from "@tanstack/react-router";
import { FloatingPage } from "./Page";
import { buttonVariants } from "./ui/button";
import { useLocale } from "@/lib/locale";
import { ArrowLeft, Blocks, Book } from "lucide-react";

export function NotFound({ children }: { children?: any }) {
	const locale = useLocale();

	return (
		<FloatingPage className="gap-8 text-center">
			<h1 className="text-7xl font-black">404</h1>
			<p>
				{children || (
					<p>The page you are looking for does not exist.</p>
				)}
			</p>
			<div className="flex sm:justify-center gap-2 flex-wrap flex-col sm:flex-row w-full">
				<Link
					to="/$locale"
					params={{ locale }}
					className={buttonVariants()}
					onClick={(e) => {
						e.preventDefault();
						window.history.back();
					}}
				>
					<ArrowLeft />
					Go Back
				</Link>
				<Link
					to="/$locale/learner"
					params={{
						locale,
					}}
					className={buttonVariants({ variant: "outline" })}
				>
					<Book />
					Learner
				</Link>
				<Link
					to="/$locale/admin"
					params={{
						locale,
					}}
					className={buttonVariants({ variant: "outline" })}
				>
					<Blocks />
					Admin
				</Link>
			</div>
		</FloatingPage>
	);
}
