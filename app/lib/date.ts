import { Language } from "@/types/translations";

export const formatDate = (date: Date, locale: Language): string => {
	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
};
