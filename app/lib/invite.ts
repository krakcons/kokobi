import { env } from "@/env";
import { Domain } from "@/types/domains";
import { Locale } from "./locale";

export const createCourseLink = ({
	domain,
	courseId,
	email,
	locale,
}: {
	domain?: Domain;
	courseId: string;
	email?: string;
	locale?: Locale;
}) => {
	const base = domain ? `https://${domain.hostname}` : env.VITE_SITE_URL;
	return `${base}${locale ? `/${locale}` : ""}/learner/courses/${courseId}${email ? `?email=${email}` : ""}`;
};
