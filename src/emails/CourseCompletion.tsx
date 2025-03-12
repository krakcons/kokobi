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

export const CourseCompletion = ({
	course = "Golfing Tutorial",
	organization = "Krak",
	href = "https://google.com",
	logo = `${env.NEXT_PUBLIC_SITE_URL}/cdn/466a5korjz3hykf/en/logo?1717019590878`,
	text = {
		title: "Congratulations!",
		completed: "Completed",
		congratulations: "Congratulations! You have completed",
		certificate: "Download your certificate of completion:",
		get: "Download",
		by: "offered by",
	},
}: {
	course?: string;
	organization?: string;
	href?: string;
	logo?: string | null;
	text: {
		title: string;
		completed: string;
		congratulations: string;
		by: string;
		certificate: string;
		get: string;
	};
}) => (
	<Html lang="en">
		<Head />
		<Preview>{text.title}</Preview>
		<Tailwind>
			<Body className="mx-auto my-auto bg-white font-sans">
				<Container className="mx-auto mt-[40px] max-w-[465px] rounded border border-solid border-border p-8 text-foreground">
					{logo && <Img src={logo} alt="logo" width={175} />}
					<Heading className={!logo ? "mt-0" : ""}>
						{text.title} {course} {text.completed}
					</Heading>
					<Text>
						{`${text.congratulations} `}
						<strong>{course}</strong>
						{` ${text.by} `}
						<strong>{organization}</strong>. {text.certificate}
					</Text>
					<Button
						className={buttonVariants({
							class: "h-auto py-3",
						})}
						href={href}
					>
						{text.get}
					</Button>
					<Hr className="my-6" />
					<Text className="mb-0">{organization}</Text>
				</Container>
			</Body>
		</Tailwind>
	</Html>
);

export default CourseCompletion;
