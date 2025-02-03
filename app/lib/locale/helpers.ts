import type { FlattenedLocalized, LocalizationObject, LocalizedQueryType } from "./types";

export const getLocalizedField = <T>(
	obj: LocalizationObject<T>,
	locale: string
): T | undefined | null => {
	if (locale === "fr" && obj["fr"] !== "") return obj[locale];
	else return obj["en"];
};

export const flattenLocalizedObject = <
	TBase extends { translations: TTranslation[] },
	TTranslation extends { locale: string } & Record<string, any>,
	TResult = FlattenedLocalized<TBase, TTranslation>,
>(
	obj?: TBase,
	options?: LocalizedQueryType
): TResult | undefined => {
	if (!obj) return undefined;
	const { locale, fallback = true } = options ?? {};

	// Find translation in requested locale or fallback to first
	const translation =
		obj.translations.find((item) => item.locale === locale) ??
		(fallback ? obj.translations[0] : undefined);

	// Create new object without translations array
	const { translations, ...rest } = obj;

	// Return base object merged with translation data
	return {
		...rest,
		...translation,
	} as TResult;
};
