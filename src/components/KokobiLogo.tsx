import WebsiteLogo from "/favicon.ico";

export const KokobiLogo = () => {
	return (
		<div className="flex flex-row items-center gap-4">
			<img
				src={WebsiteLogo}
				alt="Website Logo"
				className="min-h-10 min-w-10 max-w-10 max-h-10 rounded-full hover:grayscale-50"
			/>
			<p className="text-2xl font-bold">Kokobi</p>
		</div>
	);
};
