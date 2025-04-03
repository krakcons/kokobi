import { ErrorMessage } from "@/components/ui/error-message";
import { useTranslations } from "@/lib/locale";

export function FieldError({ errors = [] }: { errors?: any[] }) {
	const t = useTranslations();

	return errors?.length > 0 ? (
		<ErrorMessage
			text={errors
				.map((error) => {
					return error.message
						?.toString()
						.split(" ")
						.map((word: string) => {
							if (word.startsWith("t:")) {
								// @ts-ignore
								return t[word.slice(2)];
							}
							return word;
						})
						.join(" ");
				})
				.join(", ")}
		/>
	) : null;
}
