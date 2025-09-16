import { Tailwind } from "./Tailwind";
import type { Messages } from "@/lib/locale";
import en from "@/messages/en";
import { Body, Head, Html, Text } from "@react-email/components";

export const OTP = ({
	code = "123456",
	t = en.Email.OTP,
}: {
	code?: string;
	t?: Messages["Email"]["OTP"];
}) => (
	<Html>
		<Tailwind>
			<Head />
			<Body className="font-sans">
				<Text>{t.content}</Text>
				<Text className="font-bold">{code}</Text>
			</Body>
		</Tailwind>
	</Html>
);

export default OTP;
