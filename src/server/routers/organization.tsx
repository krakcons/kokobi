import z from "zod";
import {
	base,
	organizationProcedure,
	protectedProcedure,
	publicProcedure,
} from "../middleware";
import {
	OrganizationFormSchema,
	OrganizationSchema,
} from "@/types/organization";
import { db } from "../db";
import {
	domains,
	organizations,
	organizationTranslations,
	sessions,
	usersToCourses,
} from "../db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import { ORPCError } from "@orpc/client";
import { handleLocalization } from "@/lib/locale";
import {
	CreateEmailIdentityCommand,
	DeleteEmailIdentityCommand,
	GetEmailIdentityCommand,
	PutEmailIdentityMailFromAttributesCommand,
} from "@aws-sdk/client-sesv2";
import { ses } from "../ses";
import { cf } from "../cloudflare";
import { env } from "../env";
import {
	DomainFormSchema,
	DomainRecordSchema,
	DomainSchema,
	type DomainRecord,
} from "@/types/domains";
import { APIError } from "cloudflare";
import { auth } from "@/lib/auth";
import { s3 } from "../s3";

export const organizationRouter = base.prefix("/organizations").router({
	get: protectedProcedure
		.route({
			tags: ["Organization"],
			method: "GET",
			path: "/",
			summary: "Get Organizations",
		})
		.output(OrganizationSchema.array())
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
	setActive: protectedProcedure
		.route({
			tags: ["Organization"],
			method: "PUT",
			path: "/set-active",
			summary: "Set Active Organization",
		})
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input: { id } }) => {
			await auth.api.setActiveOrganization({
				headers: context.headers,
				body: {
					organizationId: id,
				},
			});
		}),
	create: protectedProcedure
		.route({
			tags: ["Organization"],
			method: "POST",
			path: "/",
			summary: "Create Organization",
		})
		.input(OrganizationFormSchema)
		.output(z.object({ id: z.string() }))
		.handler(async ({ context, input: { name, favicon, logo } }) => {
			const organization = await auth.api.createOrganization({
				headers: context.headers,
				body: {
					name,
					slug: name.toLowerCase().replaceAll(" ", "-"),
				},
			});

			if (!organization) {
				throw new ORPCError("INTERNAL_SERVER_ERROR");
			}

			let logoUrl = null;
			if (logo) {
				const extension = logo.name.split(".").pop();
				const path = `${organization.id}/${context.locale}/logo.${extension}`;
				await s3.write(path, logo, {
					type: logo.type,
				});
				logoUrl = path;
			}

			let faviconUrl = null;
			if (favicon) {
				const extension = favicon.name.split(".").pop();
				const path = `${organization.id}/${context.locale}/favicon.${extension}`;
				await s3.write(path, favicon, {
					type: favicon.type,
				});
				faviconUrl = path;
			}

			await db.insert(organizationTranslations).values({
				name,
				organizationId: organization.id,
				locale: context.locale,
				logo: logoUrl,
				favicon: faviconUrl,
			});

			return {
				id: organization.id,
			};
		}),
	update: organizationProcedure
		.route({
			tags: ["Organization"],
			method: "PUT",
			path: "/",
			summary: "Update Organization",
		})
		.input(OrganizationFormSchema)
		.output(z.null())
		.handler(async ({ context, input: { name, favicon, logo } }) => {
			let logoUrl = null;
			if (logo) {
				const extension = logo.name.split(".").pop();
				const path = `${context.activeOrganizationId}/${context.locale}/logo.${extension}`;
				await s3.write(path, logo, {
					type: logo.type,
				});
				logoUrl = path;
			} else {
				await s3.delete(
					`${context.activeOrganizationId}/${context.locale}/logo`,
				);
			}

			let faviconUrl = null;
			if (favicon) {
				const extension = favicon.name.split(".").pop();
				const path = `${context.activeOrganizationId}/${context.locale}/favicon.${extension}`;
				await s3.write(path, favicon, {
					type: favicon.type,
				});
				faviconUrl = path;
			} else {
				await s3.delete(
					`${context.activeOrganizationId}/${context.locale}/favicon`,
				);
			}

			await db
				.insert(organizationTranslations)
				.values({
					name,
					locale: context.locale,
					organizationId: context.activeOrganizationId,
					logo: logoUrl,
					favicon: faviconUrl,
				})
				.onConflictDoUpdate({
					set: {
						name,
						logo: logoUrl,
						favicon: faviconUrl,
						updatedAt: new Date(),
					},
					target: [
						organizationTranslations.organizationId,
						organizationTranslations.locale,
					],
				});

			return null;
		}),
	delete: organizationProcedure
		.route({
			tags: ["Organization"],
			method: "DELETE",
			path: "/",
			summary: "Delete Organization",
		})
		.handler(async ({ context }) => {
			const files = await s3.list({
				prefix: `${context.activeOrganizationId}/`,
				maxKeys: 1000,
			});
			if (files.contents) {
				await Promise.all(
					files.contents.map((file) => {
						s3.delete(file.key);
					}),
				);
			}
			await auth.api.deleteOrganization({
				headers: context.headers,
				body: {
					organizationId: context.activeOrganizationId,
				},
			});
			await db
				.update(sessions)
				.set({ activeOrganizationId: null })
				.where(
					eq(
						sessions.activeOrganizationId,
						context.activeOrganizationId,
					),
				);
		}),
	current: organizationProcedure
		.route({
			tags: ["Organization"],
			method: "GET",
			path: "/current",
			summary: "Get Current Organization",
		})
		//.output(OrganizationSchema)
		.handler(async ({ context }) => {
			const organization = await db.query.organizations.findFirst({
				where: eq(organizations.id, context.activeOrganizationId),
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
							context.activeOrganizationId,
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
			.output(
				DomainSchema.extend({
					records: DomainRecordSchema.array(),
				}).nullable(),
			)
			.handler(async ({ context }) => {
				const organizationDomain = await db.query.domains.findFirst({
					where: and(
						eq(
							domains.organizationId,
							context.activeOrganizationId,
						),
					),
				});

				if (!organizationDomain) {
					return null;
				}

				const command = new GetEmailIdentityCommand({
					EmailIdentity: organizationDomain.hostname,
				});
				const email = await ses.send(command);

				const cloudflare = await cf.customHostnames.get(
					organizationDomain.hostnameId,
					{
						zone_id: env.CLOUDFLARE_ZONE_ID,
					},
				);

				const subdomain = organizationDomain.hostname
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
					...organizationDomain,
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
						context.activeOrganizationId,
					),
				});

				if (existingDomain) {
					throw new ORPCError("BAD_REQUEST", {
						message: "Domain already exists",
					});
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
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message: "Error creating SES identity",
					});
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
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message: "Error creating SES identity",
					});
				}

				await db.insert(domains).values({
					id: Bun.randomUUIDv7(),
					hostname,
					hostnameId,
					organizationId: context.activeOrganizationId,
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
							context.activeOrganizationId,
						),
					),
				});

				if (!domain) {
					throw new ORPCError("NOT_FOUND", {
						message: "Domain not found",
					});
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
								context.activeOrganizationId,
							),
						),
					);

				return null;
			}),
	},
	member: {
		get: organizationProcedure
			.route({
				tags: ["Organization"],
				method: "GET",
				path: "/member",
				summary: "Get Members",
			})
			.handler(async ({ context }) => {
				return await auth.api.listMembers({
					headers: context.headers,
				});
			}),
	},
	invitation: {
		get: organizationProcedure
			.route({
				tags: ["Organization"],
				method: "GET",
				path: "/invitation",
				summary: "Get Invitations",
			})
			.handler(async ({ context }) => {
				return await auth.api.listInvitations({
					headers: context.headers,
				});
			}),
	},
});
