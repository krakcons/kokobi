import { Link, useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button, buttonVariants } from "./ui/button";
import { useLocale } from "@/lib/locale";
import { FloatingPage } from "./Page";
import { ArrowLeft, Blocks, Book, RefreshCw } from "lucide-react";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
	const router = useRouter();
	const locale = useLocale();

	return (
		<FloatingPage className="gap-8 text-center">
			<h1>Something went wrong!</h1>
			<p>{error.message}</p>
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
				<Button
					onClick={() => {
						router.invalidate();
					}}
					variant="outline"
				>
					<RefreshCw />
					Try Again
				</Button>
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
