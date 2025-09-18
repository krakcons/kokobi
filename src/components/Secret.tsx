import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/CopyButton";
import { cn } from "@/lib/utils";

export const Secret = ({ secret }: { secret: string }) => {
	const [hidden, setHidden] = useState(true);

	return (
		<div className="flex items-center">
			<code className={cn("text-sm mr-2", hidden ? "pt-1" : "")}>
				{hidden ? secret.replaceAll(/./g, "*") : secret}
			</code>
			<Button
				size="icon"
				variant="ghost"
				onClick={() => setHidden(!hidden)}
			>
				{hidden ? (
					<Eye className="size-5" />
				) : (
					<EyeOff className="size-5" />
				)}
			</Button>
			<CopyButton text={secret} />
		</div>
	);
};
