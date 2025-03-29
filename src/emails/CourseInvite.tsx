import { Tailwind } from "@/components/email/Tailwind";
import { buttonVariants } from "@/components/ui/button";
import { Messages } from "@/lib/locale";
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
	name = "Golfing Tutorial",
	teamName = "CompanionLink",
	logo = "/favicon.ico",
	t = {
		subject: "",
		title: "Invitation",
		invite: "invites you to join the following:",
		start: "Join",
		below: "☕ Need to take a break? We got you covered. Learn at your own pace by clicking the button above to pick up where you left off at any time. \n\n When you’ve completed your learning, you’ll receive an email with a Certificate of Completion. \n\n Please refrain from responding to this email as there is no corresponding inbox for replies. \n\n Happy Learning!",
	},
}: {
	href: string;
	name?: string;
	teamName?: string;
	logo?: string;
	t: Messages["Email"]["CourseInvite"];
}) => (
	<Html lang="en">
		<Head />
		<Preview>{`${t.invite} ${name} by ${teamName}.`}</Preview>
		<Tailwind>
			<Body className="mx-auto my-auto bg-white font-sans">
				<Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-border p-8 text-foreground">
					<Img
						src={logo}
						alt="logo"
						width={175}
						className="text-[0px]"
					/>
					<Heading className={!logo ? "mt-0" : ""}>{t.title}</Heading>
					<Text>
						<strong>{teamName}</strong> {t.invite}{" "}
						<strong>{name}</strong>
					</Text>
					<Button
						className={buttonVariants({
							className: "h-5 px-3",
						})}
						href={href}
					>
						{t.start}
					</Button>
					<Hr className="my-6" />
					<Text
						style={{
							whiteSpace: "pre-line",
							margin: 0,
						}}
					>
						{t.below}
					</Text>
					<Text className="mb-0">{teamName}</Text>
				</Container>
			</Body>
		</Tailwind>
	</Html>
);

export default CourseInvite;
