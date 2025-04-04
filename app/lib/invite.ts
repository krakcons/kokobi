import { env } from "@/env";
import { Domain } from "@/types/domains";
import { Locale } from "./locale";

export const createJoinLink = ({
	domain,
	courseId,
	teamId,
	learnerId,
	locale,
}: {
	domain?: Domain;
	courseId: string;
	teamId: string;
	learnerId?: string;
	locale?: Locale;
}) => {
	const base = domain ? `https://${domain.hostname}` : env.VITE_SITE_URL;
	return `${base}${locale ? `/${locale}` : ""}/play/${teamId}/courses/${courseId}/join${learnerId ? `?learnerId=${learnerId}` : ""}`;
};
