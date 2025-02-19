export const PageHeader = ({
	title,
	description,
}: {
	title: string;
	description: string;
}) => (
	<div className="mb-4 flex flex-col gap-2 border-b border-gray-200 pb-4">
		<h1>{title}</h1>
		<p>{description}</p>
	</div>
);
