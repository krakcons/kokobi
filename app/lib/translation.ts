interface Translation {
	language: string;
	default: boolean;
}

export const translate = <T extends Translation>(
	translations: T[],
	locale?: string
): T => {
	return (
		translations.find((t) => t.language === locale) ||
		translations.find((t) => t.default) ||
		translations[0]
	);
};
