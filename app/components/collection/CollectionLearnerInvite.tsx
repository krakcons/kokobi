"use client";

import { InviteForm, LearnersInviteForm } from "@/components/learner/LearnersInviteForm";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { client } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { InferRequestType } from "hono";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const inviteLearnerFn = client.api.collections[":id"].learners.$post;

export const CollectionLearnerInvite = ({ collectionId }: { collectionId: string }) => {
	const [open, setOpen] = useState(false);
	const router = useRouter();

	const { mutate, isPending } = useMutation({
		mutationFn: async (input: InferRequestType<typeof inviteLearnerFn>) => {
			const res = await inviteLearnerFn(input);
			if (!res.ok) {
				throw new Error(await res.text());
			}
		},
		onSuccess: () => {
			router.invalidate();
			toast("Successfully Invited", {
				description: `User has been sent an invitation to join this course.`,
			});
			setOpen(false);
		},
	});

	const onSubmit = async (input: InviteForm) => {
		mutate({
			param: {
				id: collectionId,
			},
			json: input.learners,
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="icon">
					<UserPlus size={18} />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Invite learners</DialogTitle>
					<DialogDescription>Enter an email and name below.</DialogDescription>
				</DialogHeader>
				<LearnersInviteForm isPending={isPending} onSubmit={onSubmit} />
			</DialogContent>
		</Dialog>
	);
};
