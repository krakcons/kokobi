import { Messages } from "@/lib/locale";
import en from "@/messages/en";
import { Container } from "./Container";
import { Link } from "./Link";

export const CourseCompletion = ({
	name = "Golfing Tutorial",
	teamName = "Krak",
	href = "https://google.com",
	logo,
	t = en.Email.CourseCompletion,
}: {
	name?: string;
	teamName?: string;
	href?: string;
	logo?: string | null;
	t: Messages["Email"]["CourseCompletion"];
}) => (
	<Container>
		{logo && <img src={logo} alt="logo" height={100} />}
		<h1>
			{t.title} {name} {t.completed}
		</h1>
		<p>
			{`${t.congratulations} `}
			<strong>{name}</strong>
			{` ${t.by} `}
			<strong>{teamName}</strong>. {t.certificate}
		</p>
		<Link href={href}>{t.get}</Link>
		<hr style={{ marginTop: "2rem", marginBottom: "2rem" }} />
		<p style={{ marginBottom: 0 }}>{teamName}</p>
	</Container>
);

export default CourseCompletion;
