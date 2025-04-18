import { FloatingPage } from "./Page";
import { Button, buttonVariants } from "./ui/button";
import { ArrowLeft, Home } from "lucide-react";

export function NotFound({ children }: { children?: any }) {
	return (
		<FloatingPage className="gap-4 text-center">
			<h1 className="text-7xl font-black">404</h1>
			<p>
				{children || (
					<p>The page you are looking for does not exist.</p>
				)}
			</p>
			<div className="flex flex-row gap-2">
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
				<a href="/" className={buttonVariants({ variant: "outline" })}>
					<Home />
					Home
				</a>
			</div>
		</FloatingPage>
	);
}
