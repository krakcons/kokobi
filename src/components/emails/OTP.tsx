import type { Messages } from "@/lib/locale";
import en from "@/messages/en";

export const OTP = ({
	code = "123456",
	t = en.Email.OTP,
}: {
	code?: string;
	t?: Messages["Email"]["OTP"];
}) => (
	<div
		style={{
			color: "#000",
			fontFamily: "Arial, sans-serif",
		}}
	>
		<p>{t.content}</p>
		<strong>{code}</strong>
	</div>
);

export default OTP;
