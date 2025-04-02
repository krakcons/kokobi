import { useState } from "react";
import { Button } from "./ui/button";
import { Clipboard, ClipboardCheck } from "lucide-react";

const CopyButton = ({ text }: { text: string }) => {
	const [copied, setCopied] = useState(false);

	return (
		<Button
			size="icon"
			variant="ghost"
			disabled={copied}
			onClick={() => {
				navigator.clipboard.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			}}
		>
			{copied ? (
				<ClipboardCheck className="size-5" />
			) : (
				<Clipboard className="size-5" />
			)}
		</Button>
	);
};

export default CopyButton;
