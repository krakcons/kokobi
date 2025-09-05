import type { Domain } from "@/types/domains";
import {
	GetEmailIdentityCommand,
	SendEmailCommand,
} from "@aws-sdk/client-sesv2";
import type { ReactElement } from "react";
import { ses } from "../ses";
import { renderToString } from "react-dom/server";
import type { Organization } from "@/types/organization";

export const verifyEmail = async (domains: Domain[]) => {
	if (domains.length === 0) return false;
	const hostname = domains[0].hostname;
	try {
		const command = new GetEmailIdentityCommand({
			EmailIdentity: hostname,
		});
		const response = await ses.send(command);

		// Check both verification status and MAIL FROM status
		const isVerified = response.VerificationStatus === "SUCCESS";
		const hasMailFrom =
			response.MailFromAttributes?.MailFromDomainStatus === "SUCCESS";

		return isVerified && hasMailFrom;
	} catch (error) {
		// Domain likely not registered with SES
		console.error(`Error verifying domain ${hostname}:`, error);
		return false;
	}
};

export async function sendEmail({
	to,
	subject,
	content,
	organization,
}: {
	to: string[];
	subject: string;
	content: ReactElement;
	organization?: Organization & { domains: Domain[] };
}): Promise<void> {
	let fromAddress = "Kokobi <noreply@kokobi.org>";
	if (organization && organization.domains.length > 0) {
		const domain = organization.domains[0];
		fromAddress = `${organization.name} <noreply@${domain.hostname}>`;
	}
	const html = renderToString(content);
	const command = new SendEmailCommand({
		FromEmailAddress: fromAddress,
		Destination: {
			ToAddresses: to,
		},
		Content: {
			Simple: {
				Subject: { Data: subject, Charset: "UTF-8" },
				Body: {
					Html: { Data: html, Charset: "UTF-8" },
				},
			},
		},
	});
	await ses.send(command);
}
