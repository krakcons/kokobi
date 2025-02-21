import { Locale, Messages } from ".";

export type IntlConfig = {
	locale: Locale;
	messages: Messages;
};

export const createI18n = async ({ locale }: { locale: Locale }) => {
	const messages = await import(`../../messages/${locale}.ts`);
	return {
		locale: locale as Locale,
		messages: messages.default as Messages,
	} as const satisfies IntlConfig;
};

export const createTranslator = async ({ locale }: { locale: Locale }) => {
	const i18n = await createI18n({ locale });
	return i18n.messages;
};
