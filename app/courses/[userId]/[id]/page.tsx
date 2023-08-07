import { s3Client } from "@/libs/s3";
import { IMSManifestSchema, Resource } from "@/types/scorm/content";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { XMLParser } from "fast-xml-parser";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MdList } from "react-icons/md";
import LMSProvider from "./LMSProvider";

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "",
});

const getAllResources = (resource: Resource | Resource[]): Resource[] => {
	const resources: Resource[] = [];

	const traverseResource = (res: Resource | Resource[]): void => {
		if (Array.isArray(res)) {
			res.forEach((subRes) => {
				resources.push(subRes);
				traverseResource(subRes);
			});
		} else if (res) {
			resources.push(res);
		}
	};

	traverseResource(resource);
	return resources;
};

const Page = async ({
	params: { id, userId },
	searchParams,
}: {
	params: { id: string; userId: string };
	searchParams: { page?: string; toc?: string };
}) => {
	const { page, toc = "closed" } = searchParams;

	const res = await s3Client.send(
		new GetObjectCommand({
			Bucket: "krak-lms",
			Key: `courses/${userId}/${id}/imsmanifest.xml`,
		})
	);
	const text = await res.Body?.transformToString();

	if (!text) return <h1>404</h1>;

	const parsedIMSManifest = parser.parse(text).manifest;

	const scorm = IMSManifestSchema.parse(parsedIMSManifest);

	const firstOrganization = Array.isArray(scorm.organizations.organization)
		? scorm.organizations.organization[0]
		: scorm.organizations.organization;

	const resources = getAllResources(scorm.resources.resource);

	if (!page) {
		redirect(`/courses/${userId}/${id}?page=${resources[0].identifier}`);
	}

	return (
		<main className="flex h-screen w-full flex-col bg-slate-100">
			<Link
				href={{
					pathname: `/courses/${userId}/${id}`,
					query: {
						...searchParams,
						toc: toc === "open" ? "closed" : "open",
					},
				}}
				className="absolute right-4 top-4 rounded bg-white p-2 text-black shadow-xl"
			>
				<MdList size={25} />
			</Link>
			<div className="flex flex-1 flex-row">
				{toc === "open" && (
					<aside className="fixed bottom-0 left-0 top-0 flex max-w-sm flex-col bg-white p-4 text-slate-600 sm:relative">
						<h3 className="mb-2 text-2xl font-bold text-slate-700">
							Table of Contents
						</h3>
						{Array.isArray(firstOrganization.item) ? (
							firstOrganization.item.map((item) => {
								if (Array.isArray(item.item)) {
									return (
										<div
											key={item.identifier}
											className="flex-col"
										>
											<p className="py-2 font-bold text-slate-800">
												{item.title}
											</p>
											{item.item.map((subItem) => (
												<Link
													className="ml-4 flex cursor-pointer py-1"
													key={subItem.identifier}
													href={{
														pathname: `/courses/${userId}/${id}`,
														query: {
															toc,
															page: subItem.identifierref,
														},
													}}
												>
													{subItem.title}
												</Link>
											))}
										</div>
									);
								}
								return (
									<Link
										className="ml-4 flex cursor-pointer py-1"
										key={item.identifier}
										href={{
											pathname: `/courses/${userId}/${id}`,
											query: {
												toc,
												page: item.identifierref,
											},
										}}
									>
										{item.title}
									</Link>
								);
							})
						) : (
							<Link
								className="ml-4 flex cursor-pointer py-1"
								href={{
									pathname: `/courses/${userId}/${id}`,
									query: {
										page: firstOrganization.item
											.identifierref,
									},
								}}
							>
								{firstOrganization.item.title}
							</Link>
						)}
					</aside>
				)}
				{page && (
					<LMSProvider version={scorm.metadata.schemaversion}>
						<iframe
							src={`/courses/${userId}/${id}/${resources.find(
								(resource) => resource.identifier === page
							)?.href}`}
							className="h-full flex-1"
						/>
					</LMSProvider>
				)}
			</div>
		</main>
	);
};

export default Page;
