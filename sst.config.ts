/// <reference path="./.sst/platform/config.d.ts" />

const PROFILE = "krak";
const LOCAL_STAGES = ["billyhawkes"];
const ROOT_DOMAIN = "kokobi.org";
const STAGES = ["prod", "dev", ...LOCAL_STAGES];

const WELCOME_TEAM_ID = {
	billyhawkes: "019663b4-85ea-7000-a056-7a9863194546",
	dev: "01966381-cf55-7000-8e26-ee32fb2db600",
	prod: "01966381-cf55-7000-8e26-ee32fb2db600",
};

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
		const cloudflareZone = cloudflare.getZoneOutput({
			name: ROOT_DOMAIN,
		});
		const bucket = new sst.aws.Bucket("Bucket", {
			access: "public",
		});

		const environment = {
			CLOUDFLARE_API_TOKEN: new sst.Secret("CLOUDFLARE_API_TOKEN").value,
			CLOUDFLARE_ZONE_ID: cloudflareZone.id,
			OPENAI_API_KEY: new sst.Secret("OPENAI_API_KEY").value,
			// Bun adapters
			DATABASE_URL: $interpolate`postgres://${aurora.username}:${aurora.password}@${aurora.host}:${aurora.port}/${$app.name}-${$app.stage}`,
			S3_BUCKET: bucket.name,
			// URLS
			VITE_SITE_URL: LOCAL_STAGES.includes($app.stage)
				? "http://localhost:3000"
				: `https://${domain}`,
			VITE_ROOT_DOMAIN: LOCAL_STAGES.includes($app.stage)
				? "localhost:3000"
				: domain,
			WELCOME_TEAM_ID:
				WELCOME_TEAM_ID[$app.stage as keyof typeof WELCOME_TEAM_ID],
		};

		// EMAIL //
		const email = new sst.aws.Email("Email", {
			sender: domain,
			dns,
		});
		if (email) {
			new aws.ses.MailFrom("MailFrom", {
				mailFromDomain: emailDomain,
				domain,
			});
			new cloudflare.Record("MX", {
				zoneId: cloudflareZone.id,
				name: emailDomain,
				type: "MX",
				priority: 10,
				value: "feedback-smtp.ca-central-1.amazonses.com",
			});
			new cloudflare.Record("TXT", {
				zoneId: cloudflareZone.id,
				name: emailDomain,
				type: "TXT",
				value: '"v=spf1 include:amazonses.com ~all"',
			});
		}

		const cluster = new sst.aws.Cluster("Cluster", {
			vpc,
			forceUpgrade: "v2",
		});

		new sst.aws.Service("TSS", {
			link: [bucket, aurora, email],
			cluster,
			cpu: "1 vCPU",
			memory: "2 GB",
			loadBalancer: {
				ports: [{ listen: "443/https", forward: "3000/http" }],
				domain: {
					name: domain,
					dns,
				},
			},
			permissions: [
				{
					actions: [
						"ses:CreateEmailIdentity",
						"ses:DeleteEmailIdentity",
						"ses:GetEmailIdentity",
						"ses:PutEmailIdentityMailFromAttributes",
					],
					resources: ["*"],
				},
			],
			dev: {
				command: "bun dev",
			},
			environment,
		});

		// Dev
		new sst.x.DevCommand("Studio", {
			link: [aurora],
			dev: {
				command: "drizzle-kit studio",
			},
			environment,
		});
		new sst.x.DevCommand("EmailClient", {
			dev: {
				command: "bun email",
			},
		});
	},
});
