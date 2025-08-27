import { S3Client } from "bun";
import { env } from "./env";

export const s3 = new S3Client({
	accessKeyId: env.AWS_ACCESS_KEY_ID,
	secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	bucket: env.S3_BUCKET,
	region: "ca-central-1",
});
