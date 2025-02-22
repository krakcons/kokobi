import { env } from "@/env";
import { S3Client } from "bun";

export const r2 = new S3Client({
	accessKeyId: env.R2_KEY_ID,
	secretAccessKey: env.R2_SECRET,
	endpoint: env.R2_ENDPOINT,
	region: "auto",
});

export const deleteFolder = async (prefix: string) => {
	throw new Error("Not implemented");
	//let nextContinuationToken = null;
	//
	//const parser = new XMLParser({
	//	ignoreAttributes: false,
	//	attributeNamePrefix: "",
	//});
	//
	//do {
	//	const res = await r2.fetch(
	//		`${env.R2_ENDPOINT}?list-type=2&prefix=${prefix}${nextContinuationToken ? `&continuation-token=${nextContinuationToken}` : ""}`,
	//		{
	//			method: "GET",
	//			headers: {
	//				Accept: "application/json",
	//			},
	//		},
	//	);
	//	const text = await res.text();
	//	const listObjectsData = parser.parse(text);
	//
	//	// Delete each object
	//	const deletePromises = listObjectsData?.ListBucketResult?.Contents?.map(
	//		(obj: any) => {
	//			return r2.fetch(`${env.R2_ENDPOINT}/${obj.Key}`, {
	//				method: "DELETE",
	//			});
	//		},
	//	);
	//
	//	if (deletePromises) await Promise.all(deletePromises);
	//
	//	// Check for pagination
	//	nextContinuationToken = listObjectsData.NextContinuationToken;
	//} while (nextContinuationToken);
	//
	//console.log("All objects under prefix", prefix, "have been deleted.");
};
