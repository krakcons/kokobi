import { env } from "@/env";
import { Domain } from "@/types/domains";
import { Locale } from "./locale";

export const createConnectionLink = ({
	domain,
	type,
	id,
	teamId,
	locale,
}: {
	domain?: Domain;
	type: "course" | "collection";
	id: string;
	teamId?: string;
	locale?: Locale;
}) => {
	const base = domain ? `https://${domain.hostname}` : env.VITE_SITE_URL;
	const url = new URL(base);
	url.pathname = `${locale ? `/${locale}` : ""}/learner/${type}s/${id}`;
	if (teamId && !domain) {
		url.searchParams.set("teamId", teamId);
	}
	return url.toString();
};
