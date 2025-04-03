import { AlertCircle } from "lucide-react";
import { FormItem, FormMessage } from "./form";

export const FormError = ({ message }: { message: string }) => (
	<FormItem>
		<FormMessage className="flex items-center gap-2">
			<AlertCircle size={18} />
			{message}
		</FormMessage>
	</FormItem>
);
