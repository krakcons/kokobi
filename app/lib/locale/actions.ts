import { createServerFn } from "@tanstack/start";
import { IntlConfig } from "use-intl";
import { getCookie, getHeader, setCookie } from "vinxi/http";
import { Locale, LocaleSchema, Messages } from ".";

export const getLocale = createServerFn({
	method: "GET",
}).handler(() => {
	const locale = getCookie("locale");
	if (locale) {
		return locale as "en" | "fr";
	} else {
		const acceptlocale = getHeader("accept-locale")?.split(",")[0];
		const locale = acceptlocale?.startsWith("fr") ? "fr" : "en";
		setCookie("locale", locale, {
			path: "/",
			httpOnly: true,
			secure: true,
			sameSite: "lax",
		});
		return locale;
	}
});

export const setLocale = createServerFn({
	method: "POST",
})
	.validator(LocaleSchema)
	.handler(({ data: locale }) => {
		setCookie("locale", locale);
	});

export const getI18n = createServerFn({
	method: "GET",
})
	.validator(LocaleSchema)
	.handler(async ({ data: locale }) => {
		const messages = await import(`../../messages/${locale}.ts`);

		return {
			locale: locale as Locale,
			timeZone: "UTC",
			messages: messages.default as Messages,
		} as const satisfies IntlConfig;
	});
