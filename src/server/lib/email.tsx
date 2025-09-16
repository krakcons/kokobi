import type { Domain } from "@/types/domains";
import {
	GetEmailIdentityCommand,
	SendEmailCommand,
} from "@aws-sdk/client-sesv2";
import type { ReactElement } from "react";
import { ses } from "../ses";
import type { Organization } from "@/types/organization";
import { createTranslator, handleLocalization } from "@/lib/locale";
import { getTenant } from "./tenant";
import { organizations } from "../db/auth";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { getLocaleContext } from "../middleware";
import { render } from "@react-email/components";
import { OTP } from "@/emails/OTP";

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

export const sendVerificationOTP = async (
	{
		email,
		otp,
	}: {
		email: string;
		otp: string;
	},
	request?: Request,
) => {
	const context = getLocaleContext(new Headers(request?.headers));

	let organization = undefined;
	const tenantId = await getTenant();
	if (tenantId) {
		const organizationBase = await db.query.organizations.findFirst({
			where: eq(organizations.id, tenantId),
			with: {
				translations: true,
				domains: true,
			},
		});
		if (organizationBase) {
			organization = handleLocalization(context, organizationBase);
		}
	}

	const emailVerified =
		organization && (await verifyEmail(organization.domains));

	const t = await createTranslator(context);

	await sendEmail({
		to: [email],
		subject: t.Email.OTP.subject,
		organization: emailVerified ? organization : undefined,
		content: <OTP code={otp} t={t.Email.OTP} />,
	});
};
