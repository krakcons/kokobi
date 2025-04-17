import { FloatingPage } from "./Page";
import { Button, buttonVariants } from "./ui/button";
import { ArrowLeft, Blocks, Book } from "lucide-react";

export function NotFound({ children }: { children?: any }) {
	return (
		<FloatingPage className="gap-8 text-center">
			<h1 className="text-7xl font-black">404</h1>
			<p>
				{children || (
					<p>The page you are looking for does not exist.</p>
				)}
			</p>
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
