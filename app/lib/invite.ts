import { env } from "@/env";
import { Domain } from "@/types/domains";
import { Locale } from "./locale";

export const createCourseLink = ({
	domain,
	courseId,
	teamId,
	email,
	locale,
	path,
}: {
	domain?: Domain;
	courseId: string;
	teamId?: string;
	email?: string;
	locale?: Locale;
	path?: string;
}) => {
	const base = domain ? `https://${domain.hostname}` : env.VITE_SITE_URL;
	const url = new URL(base);
	url.pathname = `${locale ? `/${locale}` : ""}/learner/courses/${courseId}${path ? `/${path}` : ""}`;
	if (email) {
		url.searchParams.set("email", email);
	}
	if (teamId) {
		url.searchParams.set("teamId", teamId);
	}
	return url.toString();
};
