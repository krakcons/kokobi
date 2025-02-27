import { serve } from "bun";
import app from "./api";
import index from "./index.html";
import { env } from "./env";

const server = serve({
	routes: {
		"/*": index,
		"/favicon.ico": new Response(
			await Bun.file("./app/assets/favicon.ico").bytes(),
			{
				headers: {
					"Content-Type": "image/x-icon",
				},
			},
		),
		"/certificate.png": new Response(
			await Bun.file("./app/assets/certificate.png").bytes(),
			{
				headers: {
					"Content-Type": "image/png",
				},
			},
		),
		"/fonts/Inter-Regular.ttf": new Response(
			await Bun.file("./app/assets/fonts/Inter-Regular.ttf").bytes(),
			{
				headers: {
					"Content-Type": "font/ttf",
				},
			},
		),
		"/fonts/Inter-Italic.ttf": new Response(
			await Bun.file("./app/assets/fonts/Inter-Italic.ttf").bytes(),
			{
				headers: {
					"Content-Type": "font/ttf",
				},
			},
		),
		"/fonts/Inter-Bold.ttf": new Response(
			await Bun.file("./app/assets/fonts/Inter-Bold.ttf").bytes(),
			{
				headers: {
					"Content-Type": "font/ttf",
				},
			},
		),
		"/fonts/Inter-BoldItalic.ttf": new Response(
			await Bun.file("./app/assets/fonts/Inter-BoldItalic.ttf").bytes(),
			{
				headers: {
					"Content-Type": "font/ttf",
				},
			},
		),
		"/api/*": {
			GET: app.fetch,
			POST: app.fetch,
			PUT: app.fetch,
			DELETE: app.fetch,
		},
		"/cdn/*": (req) => {
			return fetch(env.PUBLIC_CDN_URL + req.url.split("/cdn")[1]);
		},
	},
	development: true,
	maxRequestBodySize: 1024 * 1024 * 1024, // 1GB
});

console.log(`Server running at ${server.url}`);
