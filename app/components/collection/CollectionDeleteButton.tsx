"use client";

import { client } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { InferRequestType } from "hono";
import { Trash } from "lucide-react";
import { Button } from "../ui/button";

const deleteCollectionFn = client.api.collections[":id"].$delete;

export const CollectionDeleteButton = ({ collectionId }: { collectionId: string }) => {
	const router = useRouter();
	const { mutate } = useMutation({
		mutationFn: async (input: InferRequestType<typeof deleteCollectionFn>) => {
			const res = await deleteCollectionFn(input);
			if (!res.ok) {
				throw new Error(await res.text());
			}
		},
		onSuccess: async () => {
			router.invalidate();
		},
	});

	return (
		<Button
			variant="outline"
			onClick={() => {
				mutate({
					param: { id: collectionId },
				});
			}}
			size="icon"
		>
			<Trash size={18} />
		</Button>
	);
};
