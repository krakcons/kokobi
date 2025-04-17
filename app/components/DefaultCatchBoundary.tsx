import { useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button, buttonVariants } from "./ui/button";
import { FloatingPage } from "./Page";
import { ArrowLeft, Blocks, Book, RefreshCw } from "lucide-react";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
	const router = useRouter();

	return (
		<FloatingPage className="gap-8 text-center">
			<h1>Something went wrong!</h1>
			<p>{error.message}</p>
			<div className="flex sm:justify-center gap-2 flex-wrap flex-col sm:flex-row w-full">
				<Button
					className={buttonVariants()}
					onClick={(e) => {
						e.preventDefault();
						window.history.back();
					}}
				>
					<ArrowLeft />
					Go Back
				</Button>
				<Button
					onClick={() => {
						router.invalidate();
					}}
					variant="outline"
				>
					<RefreshCw />
					Try Again
				</Button>
				<a
					href="/learner"
					className={buttonVariants({ variant: "outline" })}
				>
					<Book />
					Learner
				</a>
				<a
					href="/admin"
					className={buttonVariants({ variant: "outline" })}
				>
					<Blocks />
					Admin
				</a>
			</div>
		</FloatingPage>
	);
}
