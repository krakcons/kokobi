import { env } from "@/env";
import { Domain } from "@/types/domains";
import { Locale } from "./locale";

export const createRequestLink = ({
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
	url.pathname = `${locale ? `/${locale}` : ""}/learner/request`;
	url.searchParams.set("type", type);
	url.searchParams.set("id", id);
	if (teamId && !domain) {
		url.searchParams.set("teamId", teamId);
	}
	return url.toString();
};

export const createCourseLink = ({
	domain,
	courseId,
	locale,
	teamId,
}: {
	domain?: Domain;
	courseId: string;
	locale?: Locale;
	teamId?: string;
}) => {
	const base = domain ? `https://${domain.hostname}` : env.VITE_SITE_URL;
	const url = new URL(base);
	url.pathname = `${locale ? `/${locale}` : ""}/learner/courses/${courseId}`;
	if (teamId && !domain) {
		url.searchParams.set("teamId", teamId);
	}
	return url.toString();
};

export const createInviteLink = ({
	domain,
	teamId,
	locale,
}: {
	domain?: Domain;
	teamId?: string;
	locale?: Locale;
}) => {
	const base = domain ? `https://${domain.hostname}` : env.VITE_SITE_URL;
	const url = new URL(base);
	url.pathname = `${locale ? `/${locale}` : ""}/learner`;
	if (teamId && !domain) {
		url.searchParams.set("teamId", teamId);
	}
	return url.toString();
};
