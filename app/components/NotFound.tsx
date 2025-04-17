import { Link, useRouter } from "@tanstack/react-router";
import { FloatingPage } from "./Page";
import { Button, buttonVariants } from "./ui/button";
import { useLocale } from "@/lib/locale";

export function NotFound({ children }: { children?: any }) {
	const router = useRouter();
	const locale = useLocale();
	return (
		<FloatingPage className="gap-8">
			<h1 className="text-6xl font-black">404</h1>
			<p>
				{children || (
					<p>The page you are looking for does not exist.</p>
				)}
			</p>
			<p className="flex items-center gap-2 flex-wrap">
				<Button onClick={() => router.history.back()}>Go back</Button>
				<Link
					to="/$locale"
					params={{
						locale,
					}}
					className={buttonVariants({ variant: "outline" })}
				>
					Start Over
				</Link>
			</p>
		</FloatingPage>
	);
}
