import { SESv2Client } from "@aws-sdk/client-sesv2";

export const ses = new SESv2Client({
	region: process.env.AWS_REGION,
});
