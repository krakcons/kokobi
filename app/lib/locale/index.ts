import { z } from "zod";

import type enMessages from "@/messages/en";
import type { NamespaceKeys, NestedKeyOf, useTranslations } from "use-intl";

export type Messages = typeof enMessages;

export const locales = [
	{ label: "English", value: "en" },
	{ label: "Français", value: "fr" },
];
export const LocaleSchema = z.enum(["en", "fr"]);
export type Locale = z.infer<typeof LocaleSchema>;

export type MessageNamespace = NamespaceKeys<Messages, NestedKeyOf<Messages>>;

export type Translator<NestedKey extends MessageNamespace = never> = ReturnType<
	typeof useTranslations<NestedKey>
>;
