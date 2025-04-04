import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

const credentials = await fromNodeProviderChain()();

export const s3 = new Bun.S3Client({
	...credentials,
});
