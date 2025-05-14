import { z } from "zod";

import type enMessages from "@/messages/en";
import { createContext, useContext } from "react";

// For best use, pair with a server handler users.locales to manage the user locale

// TYPES
export type Messages = typeof enMessages;

export const locales = [
	{ label: "English", value: "en" as const },
	{ label: "Français", value: "fr" as const },
];

export const LocaleSchema = z.enum(["en", "fr"]);

export type Locale = z.infer<typeof LocaleSchema>;

export type IntlConfig = {
	locale: Locale;
	messages: Messages;
};

export const LocalizedInputSchema = z.object({
	locale: LocaleSchema.optional().default("en"),
	fallbackLocale: LocaleSchema.or(z.literal("none")).optional(),
});
export type LocalizedInputType = z.infer<typeof LocalizedInputSchema>;

export type LocalizationObject<T> = {
	en?: T | null;
	fr?: T | null;
};

// CONTEXT/HOOKS
export const IntlContext = createContext<IntlConfig | null>(null);

export const IntlProvider = ({
	i18n,
	children,
}: {
	i18n: IntlConfig;
	children: React.ReactNode;
}) => {
	return <IntlContext.Provider value={i18n}>{children}</IntlContext.Provider>;
};

export const useLocale = () => {
	const i18n = useContext(IntlContext);

	if (!i18n) {
		throw new Error("useLocale must be used within an IntlProvider");
	}

	return i18n.locale;
};

export const useTranslations = <TNamespace extends keyof Messages>(
	namespace?: TNamespace,
	defaultI18n?: IntlConfig,
): TNamespace extends undefined ? Messages : Messages[TNamespace] => {
	const i18n = useContext(IntlContext) ?? defaultI18n;

	if (!i18n) {
		throw new Error("useTranslation must be used within an IntlProvider");
	}

	if (namespace) {
		// @ts-expect-error
		return i18n.messages[namespace];
	}

	// @ts-expect-error
	return i18n.messages;
};

// API
export const createI18n = async ({ locale }: { locale: Locale }) => {
	const messages = await import(`../messages/${locale}.ts`);
	return {
		locale: locale as Locale,
		messages: messages.default as Messages,
	} as const satisfies IntlConfig;
};

export const createTranslator = async ({ locale }: { locale: Locale }) => {
	const i18n = await createI18n({ locale });
	return i18n.messages;
};

export const getLocalizedField = <T,>(
	obj: LocalizationObject<T>,
	locale: string,
): T | undefined | null => {
	if (locale === "fr" && obj["fr"] !== "") return obj[locale];
	else return obj["en"];
};

export const handleLocalization = <
	TBase extends { translations: Array<{ locale: string }> },
	TTranslation = TBase["translations"][number],
	TResult = Omit<TBase & TTranslation, "translations">,
	TVariables extends LocalizedInputType = LocalizedInputType,
>(
	c: TVariables,
	obj: TBase,
	customLocale?: Locale,
): TResult => {
	const locale = customLocale ?? c.locale;
	const fallbackLocale = c.fallbackLocale;

	// Find translation in requested locale or fallback to first
	let translation = undefined;
	switch (fallbackLocale) {
		case "none":
			translation = obj.translations.find(
				(item) => item.locale === locale,
			);
			break;
		default:
			translation = obj.translations.find(
				(item) => item.locale === locale,
			);
			if (!translation) {
				if (fallbackLocale) {
					translation = obj.translations.find(
						(item) => item.locale === fallbackLocale,
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
