import { Tailwind as EmailTailwind } from "@react-email/components";

export const Tailwind = ({ children }: { children: React.ReactNode }) => {
	return (
		<EmailTailwind
			config={{
				theme: {
					extend: {
						colors: {
							background: "#FFFFFF",
							foreground: "#0A1F44",
							card: "#FFFFFF",
							"card-foreground": "#0A1F44",
							popover: "#FFFFFF",
							"popover-foreground": "#0A1F44",
							primary: "#1C2A47",
							"primary-foreground": "#F2F8FC",
							secondary: "#F1F5F9",
							"secondary-foreground": "#1C2A47",
							muted: "#F1F5F9",
							"muted-foreground": "#767D92",
							accent: "#F1F5F9",
							"accent-foreground": "#1C2A47",
							destructive: "#FF3B30",
							"destructive-foreground": "#F2F8FC",
							border: "#E9F2FA",
							input: "#E9F2FA",
							ring: "#0A1F44",
						},
						borderRadius: {
							custom: "0.5rem",
						},
					},
				},
			}}
		>
			{children}
		</EmailTailwind>
	);
};
