import { Tailwind } from "./Tailwind";
import { buttonVariants } from "@/components/ui/button";
import type { Messages } from "@/lib/locale";
import en from "@/messages/en";
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

export const CourseCompletion = ({
	name = "Golfing Tutorial",
	organizationName = "Krak",
	href = "https://google.com",
	logo,
	t = en.Email.CourseCompletion,
}: {
	name?: string;
	organizationName?: string;
	href?: string;
	logo?: string | null;
	t: Messages["Email"]["CourseCompletion"];
}) => (
	<Html lang="en">
		<Tailwind>
			<Head />
			<Body className="mx-auto my-auto bg-white font-sans">
				<Preview>{t.title}</Preview>
				<Container className="mx-auto mt-[40px] max-w-[465px] rounded border border-solid border-border p-8 text-foreground">
					{logo && <Img src={logo} alt="logo" height={100} />}
					<Heading className={!logo ? "mt-0" : ""}>
						{t.title} {name} {t.completed}
					</Heading>
					<Text>
						{`${t.congratulations} `}
						<strong>{name}</strong>
						{` ${t.by} `}
						<strong>{organizationName}</strong>. {t.certificate}
					</Text>
					<Button
						className={buttonVariants({
							class: "h-auto py-3",
						})}
						href={href}
					>
						{t.get}
					</Button>
					<Hr className="mt-6" />
					<Text className="mb-0">{organizationName}</Text>
				</Container>
			</Body>
		</Tailwind>
	</Html>
);

export default CourseCompletion;
