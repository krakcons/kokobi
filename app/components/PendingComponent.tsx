import { LoaderCircle } from "lucide-react";
import { FloatingPage } from "./Page";
import { useTheme } from "@/lib/theme";

export const PendingComponent = () => {
	useTheme();

	return (
		<FloatingPage localeToggle={false}>
			<LoaderCircle className="animate-spin size-12" />
		</FloatingPage>
	);
};
