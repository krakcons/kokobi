import { SESv2Client } from "@aws-sdk/client-sesv2";
import { env } from "./env";

export const ses = new SESv2Client({
	region: "ca-central-1",
	endpoint: "https://email.ca-central-1.amazonaws.com",
	credentials: {
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	},
});
