import { useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button, buttonVariants } from "./ui/button";
import { FloatingPage } from "./Page";
import { ArrowLeft, RefreshCw } from "lucide-react";

export const ErrorComponent = ({ error }: ErrorComponentProps) => {
	const router = useRouter();

	return (
		<FloatingPage className="gap-8 text-center">
			<h1>Something went wrong!</h1>
			<p>{error.message}</p>
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
				<Button
					onClick={() => {
						router.invalidate();
					}}
					variant="outline"
				>
					<RefreshCw />
					Try Again
				</Button>
			</div>
		</FloatingPage>
	);
};
