export const ErrorMessage = ({ text }: { text: string }) => {
	return (
		<em role="alert" className="text-sm text-destructive">
			{text}
		</em>
	);
};
