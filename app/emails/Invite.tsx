import { Tailwind } from "@/components/email/Tailwind";
import { buttonVariants } from "@/components/ui/button";
import { Locale, Messages } from "@/lib/locale";
import en from "@/messages/en";
import fr from "@/messages/fr";
import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Text,
} from "@react-email/components";

export const Invite = ({
	content = [
		{
			name: "Course English",
			teamName: "Team English",
			logo: "/favicon.ico",
			locale: "en",
			t: en.Email.Invite,
			href: "https://google.com",
		},
		{
			name: "Course French",
			teamName: "Team French",
			logo: "/favicon.ico",
			locale: "fr",
			href: "https://google.com",
			t: fr.Email.Invite,
		},
	],
}: {
	content?: {
		name?: string;
		teamName?: string;
		logo?: string;
		locale?: Locale;
		href?: string;
		t: Messages["Email"]["Invite"];
	}[];
}) => (
	<Html>
		<Tailwind>
			<Head />
			<Body className="mx-auto my-auto bg-white font-sans">
				<Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-border p-8 text-foreground">
					<Text className="mt-0">Un message en français suit</Text>
					{content.map(({ logo, name, teamName, t, href }, i) => (
						<Container key={i}>
							{logo && <Img src={logo} alt="logo" height={100} />}
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
							{i !== content.length - 1 && (
								<Hr className="my-8" />
							)}
						</Container>
					))}
				</Container>
			</Body>
		</Tailwind>
	</Html>
);

export default Invite;
