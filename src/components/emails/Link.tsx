export const Link = ({
	href,
	children,
}: {
	href?: string;
	children: React.ReactNode;
}) => (
	<a
		href={href}
		style={{
			display: "inline-block",
			backgroundColor: "black",
			color: "white",
			paddingLeft: "1rem",
			paddingRight: "1rem",
			paddingTop: "0.5rem",
			paddingBottom: "0.5rem",
			borderRadius: "0.5rem",
			textDecoration: "none",
		}}
	>
		{children}
	</a>
);
