import z from "zod";
import { base, organizationProcedure, publicProcedure } from "../middleware";
import { OrganizationSchema } from "@/types/team";
import { db } from "../db";
import {
	domains,
	organizations,
	organizationTranslations,
	usersToCourses,
} from "../db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import { ORPCError } from "@orpc/client";
import { handleLocalization } from "@/lib/locale";
import { getTenant } from "../lib/tenant";
import {
	CreateEmailIdentityCommand,
	DeleteEmailIdentityCommand,
	GetEmailIdentityCommand,
	PutEmailIdentityMailFromAttributesCommand,
} from "@aws-sdk/client-sesv2";
import { ses } from "../ses";
import { cf } from "../cloudflare";
import { env } from "../env";
import { DomainFormSchema, type DomainRecord } from "@/types/domains";
import { APIError } from "cloudflare";
import { auth } from "@/lib/auth";

export const organizationRouter = base.prefix("/organizations").router({
	get: organizationProcedure
		.route({
			tags: ["Organization"],
			method: "GET",
			path: "/",
			summary: "Get Organizations",
		})
		.output(OrganizationSchema)
		.handler(async ({ context }) => {
			const organizations = await auth.api.listOrganizations({
				headers: context.headers,
			});
			const translations =
				await db.query.organizationTranslations.findMany({
					where: inArray(
						organizationTranslations.organizationId,
						organizations.map((o) => o.id),
					),
				});

			return organizations.map((o) =>
				handleLocalization(context, {
					...o,
					translations: translations.filter(
						(t) => t.organizationId === o.id,
					)!,
				}),
			);
		}),
	current: organizationProcedure
		.route({
			tags: ["Organization"],
			method: "GET",
			path: "/current",
			summary: "Get Current Organization",
		})
		.output(OrganizationSchema)
		.handler(async ({ context }) => {
			const organization = await db.query.organizations.findFirst({
				where: eq(
					organizations.id,
					context.session.activeOrganizationId,
				),
				with: {
					translations: true,
					domains: true,
				},
			});

			if (!organization) {
				throw new ORPCError("NOT_FOUND");
			}

			return handleLocalization(context, organization);
		}),
	id: publicProcedure
		.input(z.object({ id: z.string() }))
		.output(OrganizationSchema)
		.handler(async ({ context, input: { id } }) => {
			const organization = await db.query.organizations.findFirst({
				where: eq(organizations.id, id),
				with: {
					translations: true,
					domains: true,
				},
			});

			if (!organization) {
				throw new ORPCError("NOT_FOUND");
			}

			return handleLocalization(context, organization);
		}),
	stats: organizationProcedure
		.route({
			tags: ["Organization"],
			method: "GET",
			path: "/stats",
			summary: "Get Organization Stats",
		})
		.output(z.object({ learnerCount: z.number() }))
		.handler(async ({ context }) => {
			const learnerCount = (
				await db
					.select({ count: count() })
					.from(usersToCourses)
					.where(
						eq(
							usersToCourses.organizationId,
							context.session.activeOrganizationId,
						),
					)
			)[0].count;

			return { learnerCount };
		}),
	domain: {
		get: organizationProcedure
			.route({
				tags: ["Organization"],
				method: "GET",
				path: "/domain",
				summary: "Get Domain",
			})
			.handler(async ({ context }) => {
				const teamDomain = await db.query.domains.findFirst({
					where: and(
						eq(
							domains.organizationId,
							context.session.activeOrganizationId,
						),
					),
				});

				if (!teamDomain) {
					return undefined;
				}

				const command = new GetEmailIdentityCommand({
					EmailIdentity: teamDomain.hostname,
				});
				const email = await ses.send(command);

				const cloudflare = await cf.customHostnames.get(
					teamDomain.hostnameId,
					{
						zone_id: env.CLOUDFLARE_ZONE_ID,
					},
				);

				const subdomain = teamDomain.hostname
					.split(".")
					.slice(0, -2)
					.join(".");
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
							email.MailFromAttributes.MailFromDomainStatus ??
							"unknown",
						type: "MX",
						name: `email${subdomainWithDot}`,
						value: "feedback-smtp.ca-central-1.amazonses.com",
						priority: 10,
					});
					records.push({
						required: true,
						status:
							email.MailFromAttributes.MailFromDomainStatus ??
							"unknown",
						type: "TXT",
						name: `email${subdomainWithDot}`,
						value: '"v=spf1 include:amazonses.com ~all"',
					});
				}

				return {
					...teamDomain,
					records: records.sort((a) =>
						a.status === "optional" ? 1 : -1,
					),
				};
			}),
		create: organizationProcedure
			.route({
				tags: ["Organization"],
				method: "POST",
				path: "/domain",
				summary: "Create Domain",
			})
			.input(DomainFormSchema)
			.handler(async ({ context, input: { hostname } }) => {
				const existingDomain = await db.query.domains.findFirst({
					where: eq(
						domains.organizationId,
						context.session.activeOrganizationId,
					),
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
						throw new ORPCError("INTERNAL_SERVER_ERROR", {
							message: e.errors[0].message,
						});
					}
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message: "Error creating domain in Cloudflare",
					});
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
					const command =
						new PutEmailIdentityMailFromAttributesCommand({
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
					organizationId: context.session.activeOrganizationId,
				});

				return null;
			}),
		delete: organizationProcedure
			.route({
				tags: ["Organization"],
				method: "DELETE",
				path: "/{id}/domain",
				summary: "Delete Domain",
			})
			.input(
				z.object({
					id: z.string(),
				}),
			)
			.handler(async ({ context, input: { id: domainId } }) => {
				const domain = await db.query.domains.findFirst({
					where: and(
						eq(domains.id, domainId),
						eq(
							domains.organizationId,
							context.session.activeOrganizationId,
						),
					),
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
							eq(
								domains.organizationId,
								context.session.activeOrganizationId,
							),
						),
					);

				return null;
			}),
	},
});
