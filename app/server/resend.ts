import { env } from "@/env";
import { Resend } from "resend";

export const resend = new Resend(env.RESEND_API_KEY);

export const isResendVerified = async (id: string | null) => {
	if (id) {
		const domain = await resend.domains.get(id);
		if (domain.data?.status === "verified") {
			return true;
		}
	}
	return false;
};
