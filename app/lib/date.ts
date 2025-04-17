import { Locale } from "./locale";

const dateTypes: Record<
	"readable" | "detailed",
	{
		date: Intl.DateTimeFormatOptions;
		time: Intl.DateTimeFormatOptions;
	}
> = {
	readable: {
		date: {
			year: "numeric",
			month: "long",
			day: "numeric",
		},
		time: {},
	},
	detailed: {
		date: {
			day: "numeric",
			month: "short",
			year: "numeric",
		},
		time: {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		},
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
	if (!date) return "";

	const dateType = dateTypes[type];
	const dateFormatter = new Intl.DateTimeFormat(locale, dateType.date);
	const timeFormatter = new Intl.DateTimeFormat(locale, dateType.time);

	return `${dateFormatter.format(date)} ${timeFormatter.format(date)}`;
};
