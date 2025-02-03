"use client";

import { Button } from "@/components/ui/button";
import { client } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { InferRequestType } from "hono";
import { Loader2, Minus } from "lucide-react";

const removeCourseFn = client.api.collections[":id"].courses[":courseId"].$delete;

const RemoveCourseButton = ({
	courseId,
	collectionId,
}: {
	courseId: string;
	collectionId: string;
}) => {
	const router = useRouter();
	const { mutate, isPending } = useMutation({
		mutationFn: async (input: InferRequestType<typeof removeCourseFn>) => {
			const res = await removeCourseFn(input);
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
					param: { id: collectionId, courseId },
				});
			}}
			size="icon"
			className="absolute right-0 top-0"
		>
			{isPending ? <Loader2 size={20} className="animate-spin" /> : <Minus size={24} />}
		</Button>
	);
};

export default RemoveCourseButton;
