export const Container = ({ children }: { children: React.ReactNode }) => (
	<div
		style={{
			margin: "40px auto",
			maxWidth: 465,
			border: "1px solid #ccc",
			borderRadius: "0.5rem",
			padding: "2rem",
			color: "#000",
			fontSize: "1rem",
			fontFamily: "Arial, sans-serif",
		}}
	>
		{children}
	</div>
);
