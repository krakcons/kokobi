import { Locale } from "./locale";

const dateTypes: Record<string, Intl.DateTimeFormatOptions> = {
	readable: {
		year: "numeric",
		month: "long",
		day: "numeric",
	},
	detailed: {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	},
};

export const formatDate = ({
	date,
	locale,
	type = "readable",
}: {
	date: Date;
	locale: Locale;
	type?: keyof typeof dateTypes;
}): string => {
	return new Intl.DateTimeFormat(locale, dateTypes[type]).format(date);
};
