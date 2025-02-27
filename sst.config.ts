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
			// Bun adapters
			DATABASE_URL: $interpolate`postgres://${aurora.username}:${aurora.password}@${aurora.host}:${aurora.port}/${$app.name}-${$app.stage}`,
			S3_BUCKET: bucket.name,
			// URLS
			PUBLIC_SITE_URL: LOCAL_STAGES.includes($app.stage)
				? "http://localhost:3000"
				: `https://${domain}`,
			PUBLIC_ROOT_DOMAIN: LOCAL_STAGES.includes($app.stage)
				? "localhost:3000"
				: domain,
			PUBLIC_CDN_URL: $interpolate`https://${bucket.domain}`,
		};

		const cluster = new sst.aws.Cluster("Cluster", { vpc });
		const service = new sst.aws.Service("Bun", {
			link: [bucket, aurora],
			cluster,
			serviceRegistry: {
				port: 3000,
			},
			dev: {
				command: "bun dev",
			},
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

		new sst.x.DevCommand("Studio", {
			link: [aurora],
			dev: {
				command: "drizzle-kit studio",
			},
			environment,
		});

		return {
			BUCKET: bucket.arn,
		};
	},
});
