import createMDX from "@next/mdx";
import { NextConfig } from "next";
import { withAxiom } from "next-axiom";
import nextIntl from "next-intl/plugin";

import "./env";

const withNextIntl = nextIntl();

const nextConfig: NextConfig = {
	reactStrictMode: true,
	pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
	async rewrites() {
		return [
			// CDN with and without locale
			{
				source: "/:locale/cdn/:slug*",
				destination: "https://cdn.revivios.com/:slug*",
				locale: false,
			},
			{
				source: "/cdn/:slug*",
				destination: "https://cdn.revivios.com/:slug*",
				locale: false,
			},
		];
	},
	async redirects() {
		return [
			{
				source: "/:path*/scormcontent/0",
				destination: "/:path*/scormcontent/index.html",
				permanent: true,
			},
		];
	},
	async headers() {
		return [
			{
				source: "/cdn/:slug*",
				headers: [
					{ key: "Access-Control-Allow-Origin", value: "*" },
					{
						key: "Access-Control-Allow-Methods",
						value: "GET,HEAD,OPTIONS",
					},
				],
			},
			{
				source: "/api/:path*",
				headers: [
					{ key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
					{
						key: "Access-Control-Allow-Methods",
						value: "GET,DELETE,PATCH,POST,PUT,OPTIONS",
					},
					{
						key: "Access-Control-Allow-Headers",
						value: "x-api-token, Content-Type",
					},
				],
			},
		];
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.revivios.com",
				port: "",
			},
		],
	},
	experimental: {
		ppr: true,
		mdxRs: false,
	},
	transpilePackages: ["t3-oss/env-nextjs"],
};

const withMDX = createMDX({
	options: {
		remarkPlugins: [],
		rehypePlugins: [],
	},
});

export default withAxiom(withMDX(withNextIntl(nextConfig)));
