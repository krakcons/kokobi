import { Context } from "hono";
import type { LocalizationObject, LocalizedInputType } from "./types";
import { Locale } from ".";

export const getLocalizedField = <T>(
	obj: LocalizationObject<T>,
	locale: string,
): T | undefined | null => {
	if (locale === "fr" && obj["fr"] !== "") return obj[locale];
	else return obj["en"];
};

export const handleLocalization = <
	TBase extends { translations: Array<{ language: string }> },
	TTranslation = TBase["translations"][number],
	TResult = Omit<TBase & TTranslation, "translations">,
	TVariables extends LocalizedInputType = LocalizedInputType,
>(
	c: Context<{ Variables: TVariables }>,
	obj: TBase,
	customLocale?: Locale,
): TResult => {
	const locale = customLocale ?? c.get("locale");
	const fallbackLocale = c.get("fallbackLocale");

	// Find translation in requested locale or fallback to first
	let translation = undefined;
	switch (fallbackLocale) {
		case "none":
			translation = obj.translations.find(
				(item) => item.language === locale,
			);
			break;
		default:
			translation = obj.translations.find(
				(item) => item.language === locale,
			);
			if (!translation) {
				if (fallbackLocale) {
					translation = obj.translations.find(
						(item) => item.language === fallbackLocale,
					);
				} else {
					translation = obj.translations[0];
				}
			}
			break;
	}

	// Create new object without translations array
	const { translations, ...rest } = obj;

	// Return base object merged with translation data
	return {
		...rest,
		...(translation ?? {}),
	} as TResult;
};
