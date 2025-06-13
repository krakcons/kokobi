import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { S3Client } from "bun";

export const createS3 = async () => {
	const credentials = await fromNodeProviderChain()();
	return new S3Client({
		...credentials,
	});
};
