import { Domain } from "@/types/domains";
import { Team, TeamTranslation } from "@/types/team";
import {
	GetEmailIdentityCommand,
	SendEmailCommand,
} from "@aws-sdk/client-sesv2";
import { render } from "@react-email/components";
import { ReactElement } from "react";
import { Resource } from "sst";
import { ses } from "../ses";

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
	team,
}: {
	to: string[];
	subject: string;
	content: ReactElement;
	team?: Team & TeamTranslation & { domains: Domain[] };
}): Promise<void> {
	let fromAddress = `Kokobi <noreply@${Resource.Email.sender.replace("email.", "")}>`;
	if (team && team.domains.length > 0) {
		const domain = team.domains[0];
		fromAddress = `${team.name} <noreply@${domain.hostname}>`;
	}
	const html = await render(content);
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
