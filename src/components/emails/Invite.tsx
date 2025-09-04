import type { Locale, Messages } from "@/lib/locale";
import en from "@/messages/en";
import fr from "@/messages/fr";
import { Container } from "./Container";
import { Link } from "./Link";

export const Invite = ({
	content = [
		{
			name: "Course English",
			organizationName: "Organization English",
			logo: "/favicon.ico",
			locale: "en",
			t: en.Email.Invite,
			href: "https://google.com",
		},
		{
			name: "Course French",
			organizationName: "Organization French",
			logo: "/favicon.ico",
			locale: "fr",
			href: "https://google.com",
			t: fr.Email.Invite,
		},
	],
}: {
	content?: {
		name?: string;
		organizationName?: string;
		logo?: string;
		locale?: Locale;
		href?: string;
		t: Messages["Email"]["Invite"];
	}[];
}) => (
	<Container>
		<p style={{ marginTop: 0, marginBottom: "1rem" }}>
			Un message en français suit
		</p>
		{content.map(({ logo, name, organizationName, t, href }, i) => (
			<div key={i}>
				{logo && <img src={logo} alt="logo" height={100} />}
				<p style={{ marginTop: "1rem", marginBottom: "1rem" }}>
					<strong>{organizationName}</strong>
					{` ${t.invite} `}
					<strong>{name}</strong>
				</p>
				<Link href={href}>{t.action}</Link>
				{i !== content.length - 1 && (
					<hr style={{ marginTop: "2rem", marginBottom: "2rem" }} />
				)}
			</div>
		))}
	</Container>
);

export default Invite;
