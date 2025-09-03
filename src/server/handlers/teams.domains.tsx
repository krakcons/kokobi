import { db } from "@/server/db";
import { domains } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { teamMiddleware } from "../lib/middleware";
import { createServerFn } from "@tanstack/react-start";
import { cf } from "../cloudflare";
import { APIError } from "cloudflare";
import { env } from "@/server/env";
import { ses } from "../ses";
import {
	CreateEmailIdentityCommand,
	DeleteEmailIdentityCommand,
	GetEmailIdentityCommand,
	PutEmailIdentityMailFromAttributesCommand,
} from "@aws-sdk/client-sesv2";
import { DomainFormSchema, type DomainRecord } from "@/types/domains";

export const getTeamDomainFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware({ role: "owner" })])
	.handler(async ({ context }) => {
		const teamId = context.teamId;

		const teamDomain = await db.query.domains.findFirst({
			where: and(eq(domains.teamId, teamId)),
		});

		if (!teamDomain) {
			return undefined;
		}

		const command = new GetEmailIdentityCommand({
			EmailIdentity: teamDomain.hostname,
		});
		const email = await ses.send(command);

		const cloudflare = await cf.customHostnames.get(teamDomain.hostnameId, {
			zone_id: env.CLOUDFLARE_ZONE_ID,
		});

		const subdomain = teamDomain.hostname.split(".").slice(0, -2).join(".");
		const subdomainWithDot = subdomain ? `.${subdomain}` : "";

		const records: DomainRecord[] = [
			// Add Cloudflare CNAME record
			{
				required: true,
				status:
					cloudflare.status === "active"
						? "success"
						: (cloudflare.status ?? "unknown"),
				type: "CNAME",
				name: subdomain,
				value: "kokobi.org",
			},
			// Add dmarc record (optional)
			{
				required: false,
				status: "optional",
				type: "TXT",
				name: `_dmarc${subdomainWithDot}`,
				value: '"v=DMARC1; p=none;"',
			},
		];

		// Add email verification records
		email.DkimAttributes?.Tokens?.forEach((token) => {
			records.push({
				required: true,
				status: email.DkimAttributes?.Status ?? "unknown",
				type: "CNAME",
				name: `${token}._domainkey${subdomainWithDot}`,
				value: `${token}.dkim.amazonses.com`,
			});
		});

		// Add mail from records
		if (
			email.MailFromAttributes &&
			email.MailFromAttributes.MailFromDomain
		) {
			records.push({
				required: true,
				status:
					email.MailFromAttributes.MailFromDomainStatus ?? "unknown",
				type: "MX",
				name: `email${subdomainWithDot}`,
				value: "feedback-smtp.ca-central-1.amazonses.com",
				priority: 10,
			});
			records.push({
				required: true,
				status:
					email.MailFromAttributes.MailFromDomainStatus ?? "unknown",
				type: "TXT",
				name: `email${subdomainWithDot}`,
				value: '"v=spf1 include:amazonses.com ~all"',
			});
		}

		return {
			...teamDomain,
			records: records.sort((a) => (a.status === "optional" ? 1 : -1)),
		};
	});

export const createTeamDomainFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware({ role: "owner" })])
	.validator(DomainFormSchema)
	.handler(async ({ context, data: { hostname } }) => {
		const teamId = context.teamId;

		const existingDomain = await db.query.domains.findFirst({
			where: eq(domains.teamId, teamId),
		});

		if (existingDomain) {
			throw new Error("Domain already exists");
		}

		let hostnameId: string;
		try {
			const domain = await cf.customHostnames.create({
				zone_id: env.CLOUDFLARE_ZONE_ID,
				hostname,
				ssl: {
					method: "http",
					type: "dv",
					settings: {
						http2: "on",
						tls_1_3: "on",
						min_tls_version: "1.2",
					},
				},
			});
			hostnameId = domain.id;
		} catch (e) {
			if (e instanceof APIError) {
				throw new Error(e.errors[0].message);
			}
			throw new Error("Error creating domain in Cloudflare");
		}

		try {
			const command = new CreateEmailIdentityCommand({
				EmailIdentity: hostname,
			});
			await ses.send(command);
		} catch (e) {
			await cf.customHostnames.delete(hostnameId, {
				zone_id: env.CLOUDFLARE_ZONE_ID,
			});
			console.error(e);
			throw new Error("Error creating SES identity");
		}

		try {
			const command = new PutEmailIdentityMailFromAttributesCommand({
				EmailIdentity: hostname,
				MailFromDomain: `email.${hostname}`,
			});
			await ses.send(command);
		} catch (e) {
			await cf.customHostnames.delete(hostnameId, {
				zone_id: env.CLOUDFLARE_ZONE_ID,
			});
			const command = new DeleteEmailIdentityCommand({
				EmailIdentity: hostname,
			});
			await ses.send(command);
			console.error(e);
			throw new Error("Error creating SES identity");
		}

		await db.insert(domains).values({
			id: Bun.randomUUIDv7(),
			hostname,
			hostnameId,
			teamId,
		});

		return null;
	});

export const deleteTeamDomainFn = createServerFn({ method: "POST" })
	.validator(z.object({ domainId: z.string() }))
	.middleware([teamMiddleware({ role: "owner" })])
	.handler(async ({ context: { teamId }, data: { domainId } }) => {
		const domain = await db.query.domains.findFirst({
			where: and(eq(domains.id, domainId), eq(domains.teamId, teamId)),
		});

		if (!domain) {
			throw new Error("Domain not found");
		}

		await cf.customHostnames.delete(domain.hostnameId, {
			zone_id: env.CLOUDFLARE_ZONE_ID,
		});

		const command = new DeleteEmailIdentityCommand({
			EmailIdentity: domain.hostname,
		});
		await ses.send(command);

		await db
			.delete(domains)
			.where(
				and(
					eq(domains.hostnameId, domain.hostnameId),
					eq(domains.teamId, teamId),
				),
			);

		return null;
	});
