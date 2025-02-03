"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

const CopyButton = ({ text }: { text: string }) => {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => {
			setCopied(false);
		}, 2000);
	};

	return (
		<Button variant="outline" size="sm" onClick={copy}>
			<Copy size={16} />
			{copied ? "Copied!" : "Copy"}
		</Button>
	);
};

export default CopyButton;
