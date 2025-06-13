import { Locale } from "./locale";

const dateTypes: Record<
	"readable" | "detailed",
	{
		date: Intl.DateTimeFormatOptions;
		time?: Intl.DateTimeFormatOptions;
	}
> = {
	readable: {
		date: {
			year: "numeric",
			month: "long",
			day: "numeric",
		},
		time: undefined,
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
	date?: Date;
	locale: Locale;
	type?: keyof typeof dateTypes;
}): string | undefined => {
	if (!date) return undefined;

	const dateType = dateTypes[type];
	const dateString = new Intl.DateTimeFormat(locale, dateType.date).format(
		date,
	);
	const timeString = dateType.time
		? new Intl.DateTimeFormat(locale, dateType.time).format(date)
		: undefined;

	return `${dateString}${timeString ? ` ${timeString}` : ""}`;
};

export const dateSortingFn = (a?: Date, b?: Date): number => {
	if (!a && !b) return 0;
	if (!a) return 1;
	if (!b) return -1;
	return a.getTime() - b.getTime();
};
