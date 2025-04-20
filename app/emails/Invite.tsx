import { Tailwind } from "@/components/email/Tailwind";
import { buttonVariants } from "@/components/ui/button";
import { Messages } from "@/lib/locale";
import en from "@/messages/en";
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Preview,
	Text,
} from "@react-email/components";

export const Invite = ({
	name = "Volunteer Training",
	teamName = "CompanionLink",
	href = "https://google.com",
	logo,
	t = en.Email.Invite,
}: {
	name?: string;
	href?: string;
	teamName?: string;
	logo?: string;
	t: Messages["Email"]["Invite"];
}) => (
	<Html lang="en">
		<Tailwind>
			<Head />
			<Body className="mx-auto my-auto bg-white font-sans">
				<Preview>{`${teamName} ${t.invite} ${name}`}</Preview>
				<Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-border p-8 text-foreground">
					{logo && <Img src={logo} alt="logo" height={100} />}
					<Heading className={!logo ? "mt-0" : ""}>{t.title}</Heading>
					<Text>
						<strong>{teamName}</strong>
						{` ${t.invite} `}
						<strong>{name}</strong>
					</Text>
					<Button
						className={buttonVariants({
							className: "h-5 px-3",
						})}
						href={href}
					>
						{t.action}
					</Button>
				</Container>
			</Body>
		</Tailwind>
	</Html>
);

export default Invite;
