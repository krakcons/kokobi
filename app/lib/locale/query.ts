import { QueryClient, queryOptions } from "@tanstack/react-query";

import type { Locale } from "@/lib/locale";
import { getI18n } from "@/lib/locale/actions";
import { createTranslator } from "use-intl";

export const i18nQueryOptions = (locale: Locale) =>
	queryOptions({
		queryKey: ["i18n", { locale }],
		queryFn: () => getI18n({ data: locale }),
	});

export const getTranslator = async (
	locale: string,
	queryClient: QueryClient,
) => {
	const i18n = await queryClient.ensureQueryData(
		i18nQueryOptions(locale as Locale),
	);
	return createTranslator(i18n);
};
