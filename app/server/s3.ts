import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { S3Client } from "bun";

const credentials = await fromNodeProviderChain()();

export const s3 = new S3Client({
	...credentials,
});
