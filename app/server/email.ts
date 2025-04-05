import { Domain } from "@/types/domains";
import { Team, TeamTranslation } from "@/types/team";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { render } from "@react-email/components";
import { ReactElement } from "react";
import { Resource } from "sst";

export const ses = new SESv2Client({
	region: process.env.AWS_REGION,
});

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
	let fromAddress = `Kokobi <noreply@${Resource.Email.sender}>`;
	if (team && team.domains.length > 0) {
		const domain = team.domains[0];
		fromAddress = `${team.name} <noreply@email.${domain.hostname}>`;
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
