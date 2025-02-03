import { Tailwind } from "@/components/email/Tailwind";
import { buttonVariants } from "@/components/ui/button";
import { env } from "@/env";
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Preview,
	Text,
} from "@react-email/components";

export const CourseInvite = ({
	href = "https://google.com",
	course = "Golfing Tutorial",
	organization = "CompanionLink",
	logo = `${env.NEXT_PUBLIC_SITE_URL}/cdn/ycod8h4c322hjry/en/logo`,
	text = {
		title: "Invitation",
		invite: "invites you to join the following:",
		start: "Join",
		below: "☕ Need to take a break? We got you covered. Learn at your own pace by clicking the button above to pick up where you left off at any time. \n\n When you’ve completed your learning, you’ll receive an email with a Certificate of Completion. \n\n Please refrain from responding to this email as there is no corresponding inbox for replies. \n\n Happy Learning!",
	},
}: {
	href: string;
	course?: string;
	organization?: string;
	logo?: string | null;
	text: {
		title: string;
		invite: string;
		start: string;
		below: string;
	};
}) => (
	<Html lang="en">
		<Head />
		<Preview>{`${text.invite} ${course} by ${organization}.`}</Preview>
		<Tailwind>
			<Body className="mx-auto my-auto bg-white font-sans">
				<Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-border p-8 text-foreground">
					{logo && <Img src={logo} alt="logo" width={175} />}
					<Heading className={!logo ? "mt-0" : ""}>
						{text.title}
					</Heading>
					<Text>
						<strong>{organization}</strong> {text.invite}{" "}
						<strong>{course}</strong>
					</Text>
					<Button
						className={buttonVariants({
							class: "h-auto py-3",
						})}
						href={href}
					>
						{text.start}
					</Button>
					<Hr className="my-6" />
					<Text
						style={{
							whiteSpace: "pre-line",
							margin: 0,
						}}
					>
						{text.below}
					</Text>
					<Text className="mb-0">{organization}</Text>
				</Container>
			</Body>
		</Tailwind>
	</Html>
);

export default CourseInvite;
