import { z } from "zod";

import type enMessages from "@/messages/en";
import { createContext, useContext } from "react";
import { IntlConfig } from "./actions";

export type Messages = typeof enMessages;

export const locales = [
	{ label: "English", value: "en" as const },
	{ label: "Français", value: "fr" as const },
];
export const LocaleSchema = z.enum(["en", "fr"]);
export type Locale = z.infer<typeof LocaleSchema>;

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
): TNamespace extends undefined ? Messages : Messages[TNamespace] => {
	const i18n = useContext(IntlContext);

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
