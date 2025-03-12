/// <reference path="./.sst/platform/config.d.ts" />

const PROFILE = "krak";
const LOCAL_STAGES = ["billyhawkes"];
const ROOT_DOMAIN = "kokobi.org";
const STAGES = ["prod", "dev", ...LOCAL_STAGES];

export default $config({
	app(input) {
		return {
			name: "kokobi",
			removal: input.stage === "prod" ? "retain" : "remove",
			home: "aws",
			providers: {
				aws: {
					region: "ca-central-1",
					profile: PROFILE,
				},
				cloudflare: true,
			},
		};
	},
	async run() {
		// STAGE VALIDATION //
		if (!STAGES.includes($app.stage)) {
			throw new Error(`Stage ${$app.stage} not found`);
		}

		const domain =
			$app.stage === "prod"
				? ROOT_DOMAIN
				: `${$app.stage}.${ROOT_DOMAIN}`;
		const emailDomain = `email.${domain}`;

		const vpc = sst.aws.Vpc.get("Vpc", "vpc-08c28b23ee20f3975");
		const aurora = sst.aws.Aurora.get("Aurora", "krak-prod-auroracluster");
		const dns = sst.cloudflare.dns({
			proxy: true,
		});
		const bucket = new sst.aws.Bucket("Bucket", {
			access: "public",
		});

		const environment = {
			GOOGLE_CLIENT_SECRET: new sst.Secret("GOOGLE_CLIENT_SECRET").value,
			GOOGLE_CLIENT_ID: new sst.Secret("GOOGLE_CLIENT_ID").value,
			OPENAI_API_KEY: new sst.Secret("OPENAI_API_KEY").value,
			// Bun adapters
			DATABASE_URL: $interpolate`postgres://${aurora.username}:${aurora.password}@${aurora.host}:${aurora.port}/${$app.name}-${$app.stage}`,
			S3_BUCKET: bucket.name,
			// URLS
			VITE_API_URL: LOCAL_STAGES.includes($app.stage)
				? "http://localhost:3000"
				: `https://${domain}`,
			PUBLIC_SITE_URL: LOCAL_STAGES.includes($app.stage)
				? "http://localhost:5173"
				: `https://${domain}`,
			PUBLIC_ROOT_DOMAIN: LOCAL_STAGES.includes($app.stage)
				? "localhost:5173"
				: domain,
			PUBLIC_CDN_URL: $interpolate`https://${bucket.domain}`,
		};

		// EMAIL //
		const email = new sst.aws.Email("Email", {
			sender: emailDomain,
			dns,
		});
		//const cloudflareZone = cloudflare.getZoneOutput({
		//	name: ROOT_DOMAIN,
		//});
		//if (email) {
		//	new aws.ses.MailFrom("MailFrom", {
		//		mailFromDomain: emailDomain,
		//		domain,
		//	});
		//	new cloudflare.Record("MX", {
		//		zoneId: cloudflareZone.id,
		//		name: emailDomain,
		//		type: "MX",
		//		priority: 10,
		//		value: "feedback-smtp.ca-central-1.amazonses.com",
		//	});
		//	new cloudflare.Record("TXT", {
		//		zoneId: cloudflareZone.id,
		//		name: emailDomain,
		//		type: "TXT",
		//		value: '"v=spf1 include:amazonses.com ~all"',
		//	});
		//}

		const cluster = new sst.aws.Cluster("Cluster", { vpc });
		const service = new sst.aws.Service("Bun", {
			link: [bucket, aurora, email],
			cluster,
			serviceRegistry: {
				port: 3000,
			},
			dev: {
				command: "bun dev:bun",
			},
			cpu: "1 vCPU",
			memory: "2 GB",
			environment,
		});
		if (!LOCAL_STAGES.includes($app.stage)) {
			const api = new sst.aws.ApiGatewayV2("Api", {
				vpc,
				domain: {
					name: domain,
					dns,
				},
			});
			api.routePrivate("$default", service.nodes.cloudmapService.arn);
		}

		// Dev
		new sst.x.DevCommand("Studio", {
			link: [aurora],
			dev: {
				command: "drizzle-kit studio",
			},
			environment,
		});
		new sst.x.DevCommand("Vite", {
			dev: {
				command: "bun dev",
			},
			environment,
		});
		new sst.x.DevCommand("EmailClient", {
			dev: {
				command: "bun email",
			},
		});

		return {
			BUCKET: bucket.arn,
		};
	},
});
