import { Context } from "hono";
import type { LocalizationObject, LocalizedInputType } from "./types";

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
): TResult => {
	const editingLocale = c.get("editingLocale");
	const locale = editingLocale ?? c.get("locale");
	const fallbackLocale = c.get("fallbackLocale");

	// Find translation in requested locale or fallback to first
	const translation =
		obj.translations.find((item) => item.language === locale) ??
		(fallbackLocale !== "none"
			? obj.translations.find((item) => item.language === fallbackLocale)
			: undefined);

	// Create new object without translations array
	const { translations, ...rest } = obj;

	// Return base object merged with translation data
	return {
		...rest,
		...(translation ?? {}),
	} as TResult;
};
