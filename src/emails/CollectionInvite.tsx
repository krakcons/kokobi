import { Tailwind } from "@/components/email/Tailwind";
import { buttonVariants } from "@/components/ui/button";
import { Messages } from "@/lib/locale";
import { env } from "@/server/env";
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

export const CollectionInvite = ({
	name = "Volunteer Training",
	teamName = "CompanionLink",
	logo = `${env.VITE_SITE_URL}/cdn/466a5korjz3hykf/en/logo?1717019590878`,
	t = {
		title: "Invitation",
		invite: "invites you to join the following:",
		subject: "",
		start: "Join",
		by: "offered by",
		below: "☕ Need to take a break? We got you covered. Learn at your own pace by clicking the button above to pick up where you left off at any time. \n\n For each of the above that you complete, you’ll receive an email with a Certificate of Completion. \n\n Please refrain from responding to this email as there is no corresponding inbox for replies. \n\n Happy Learning!",
	},
	courses = [
		{
			href: "https://google.com",
			name: "Golfing Tutorial",
		},
		{
			href: "https://google.com",
			name: "Medical Training",
		},
	],
}: {
	name?: string;
	courses: {
		href: string;
		name: string;
	}[];
	teamName?: string;
	logo?: string | null;
	t: Messages["Email"]["CollectionInvite"];
}) => (
	<Html lang="en">
		<Head />
		<Preview>{`${t.invite} ${name} by ${teamName}.`}</Preview>
		<Tailwind>
			<Body className="mx-auto my-auto bg-white font-sans">
				<Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-border p-8 text-foreground">
					{logo && <Img src={logo} alt="logo" width={175} />}
					<Heading className={!logo ? "mt-0" : ""}>{t.title}</Heading>
					<Text>
						<strong>{teamName}</strong> {t.invite}
					</Text>
					{courses.map((course, index) => (
						<Container
							key={index}
							className="mt-4 rounded border border-solid border-border p-4"
						>
							<Text className="mt-0 text-base font-bold">
								{course.name}
							</Text>
							<Button
								className={buttonVariants({
									class: "h-auto py-3",
								})}
								href={course.href}
							>
								{t.start}
							</Button>
						</Container>
					))}
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

export default CollectionInvite;
