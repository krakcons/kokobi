import { createAuthClient } from "better-auth/react";
import {
	emailOTPClient,
	organizationClient,
	adminClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
	plugins: [emailOTPClient(), adminClient(), organizationClient()],
});
