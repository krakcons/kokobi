import { Link, rootRouteId, useMatch, useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button, buttonVariants } from "./ui/button";
import { useLocale } from "@/lib/locale";
import { FloatingPage } from "./Page";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
	const router = useRouter();
	const isRoot = useMatch({
		strict: false,
		select: (state) => state.id === rootRouteId,
	});
	const locale = useLocale();

	return (
		<FloatingPage className="gap-8">
			<h1>Something went wrong!</h1>
			<p>{error.message}</p>
			<div className="flex gap-2 items-center flex-wrap">
				<Button
					onClick={() => {
						router.invalidate();
					}}
				>
					Try Again
				</Button>
				{isRoot ? (
					<Link
						to="/$locale"
						params={{ locale }}
						className={buttonVariants({ variant: "outline" })}
					>
						Home
					</Link>
				) : (
					<Link
						to="/$locale"
						params={{ locale }}
						className={buttonVariants({ variant: "outline" })}
						onClick={(e) => {
							e.preventDefault();
							window.history.back();
						}}
					>
						Go Back
					</Link>
				)}
			</div>
		</FloatingPage>
	);
}
