import { z } from "zod";

import type enMessages from "@/messages/en";
import { createContext, useContext } from "react";
import { redirect, type ParsedLocation } from "@tanstack/react-router";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getCookie, getHeader, setCookie } from "@tanstack/react-start/server";
import { QueryClient, queryOptions } from "@tanstack/react-query";

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
		throw new Error(
			`useTranslation must be used within an IntlProvider (Namespace: ${namespace})`,
		);
	}

	if (namespace) {
		// @ts-expect-error
		return i18n.messages[namespace];
	}

	// @ts-expect-error
	return i18n.messages;
};

// MIDDLEWARE
export const rootLocaleMiddleware = async ({
	location,
	ignorePaths,
	queryClient,
}: {
	location: ParsedLocation;
	ignorePaths?: string[];
	queryClient: QueryClient;
}) => {
	const i18n = await queryClient.ensureQueryData(i18nQueryOptions({}));
	let locale = i18n.locale;

	// Handle locale
	let pathLocale = location.pathname.split("/")[1];
	if (!ignorePaths || !ignorePaths.includes(pathLocale)) {
		if (!locales.some(({ value }) => value === pathLocale)) {
			throw redirect({
				replace: true,
				reloadDocument: true,
				href: `/${locale}${location.href}`,
			});
		}

		if (pathLocale !== locale) {
			locale = pathLocale as Locale;
			await updateI18nFn({
				data: {
					locale,
				},
			});
		}
	}

	return { locale };
};
export const localeMiddleware = createMiddleware({
	type: "function",
}).server(async ({ next }) => {
	return next({
		context: LocalizedInputSchema.parse({
			locale: getHeader("locale") ?? getCookie("locale") ?? "en",
			fallbackLocale: getHeader("fallbackLocale"),
		}),
	});
});

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

export const getI18nFn = createServerFn({ method: "GET" })
	.middleware([localeMiddleware])
	.handler(async ({ context }) => {
		const locale = context.locale;
		const i18n = await createI18n({ locale });
		return i18n;
	});

export const updateI18nFn = createServerFn({ method: "POST" })
	.validator(z.object({ locale: LocaleSchema }))
	.handler(async ({ data: { locale } }) => {
		setCookie("locale", locale);
		return { locale };
	});

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

export const i18nQueryOptions = ({ locale }: { locale?: Locale }) =>
	queryOptions({
		queryKey: ["locale"],
		queryFn: () => getI18nFn(locale ? { headers: { locale } } : {}),
	});
