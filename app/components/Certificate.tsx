import { teamImageUrl } from "@/lib/file";
import { Messages } from "@/lib/locale";
import { Team, TeamTranslation } from "@/types/team";
import {
	Document,
	Font,
	Image,
	Page as PDFPage,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";

Font.register({
	family: "Inter",
	fonts: [
		{
			src: "/fonts/Inter-Regular.ttf",
			fontWeight: 400,
		},
		{
			src: "/fonts/Inter-Italic.ttf",
			fontWeight: 400,
			fontStyle: "italic",
		},
		{
			src: "/fonts/Inter-Bold.ttf",
			fontWeight: 600,
		},
		{
			src: "/fonts/Inter-BoldItalic.ttf",
			fontWeight: 600,
			fontStyle: "italic",
		},
	],
});

Font.registerHyphenationCallback((word: any) => ["", word, ""]);

// Create styles
const styles = StyleSheet.create({
	page: {
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		gap: 30,
		fontFamily: "Inter",
		fontWeight: 400,
	},
	h1: {
		fontSize: 40,
		fontWeight: 600,
		textAlign: "center",
	},
});

export type CertificateProps = {
	name: string;
	course: string;
	completedAt: string;
	contentTeam: Team & TeamTranslation;
	connectTeam: Team & TeamTranslation;
	t: Messages["Certificate"]["pdf"];
};

export const Certificate = ({
	certificate: { name, course, completedAt, t, connectTeam, contentTeam },
}: {
	certificate: CertificateProps;
}) => {
	const sharedCourse = contentTeam.id !== connectTeam.id;

	return (
		<Document>
			<PDFPage size="A4" orientation="landscape" style={styles.page}>
				<Image
					src="/certificate.png"
					style={{
						position: "absolute",
						top: 0,
						right: 0,
						left: 0,
						bottom: 0,
					}}
				/>
				<Text style={[styles.h1, { marginTop: 15 }]}>{t.title}</Text>
				<Text>{t.message}</Text>
				<Text
					style={[
						styles.h1,
						{
							borderBottom: "1px solid black",
						},
					]}
				>
					{" " + name + " "}
				</Text>
				<View
					style={{
						width: "100%",
						maxWidth: 550,
					}}
				>
					<Text
						style={{
							textAlign: "center",
						}}
					>
						<Text
							style={{
								fontStyle: "italic",
							}}
						>
							{t.congratulations}
						</Text>
						<Text
							style={{
								fontWeight: 600,
								fontStyle: "italic",
							}}
						>
							{" " + course}
						</Text>
					</Text>
				</View>
				<View
					style={{
						justifyContent: "center",
						alignItems: "center",
						width: 200,
					}}
				>
					<Text>{completedAt}</Text>
					<View
						style={{
							width: "100%",
							height: 1,
							backgroundColor: "black",
							marginVertical: 10,
						}}
					/>
					<Text>{t.date}</Text>
				</View>
				<View
					style={{
						flexDirection: "row",
						gap: 20,
						justifyContent: "center",
						alignItems: "flex-end",
					}}
				>
					<View
						style={{
							flexDirection: "column",
							gap: 5,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{connectTeam.logo && (
							<Image
								src={teamImageUrl(connectTeam, "logo")}
								style={{
									height: 35,
									objectFit: "contain",
								}}
							/>
						)}
						<Text style={{ fontSize: 10, fontStyle: "italic" }}>
							{t.offered + " " + connectTeam.name}
						</Text>
					</View>
					{sharedCourse && (
						<View
							style={{
								flexDirection: "column",
								gap: 5,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{contentTeam.logo && (
								<Image
									src={teamImageUrl(contentTeam, "logo")}
									style={{
										height: 35,
										objectFit: "contain",
									}}
								/>
							)}
							<Text style={{ fontSize: 10, fontStyle: "italic" }}>
								{t.created + " " + contentTeam.name}
							</Text>
						</View>
					)}
				</View>
			</PDFPage>
		</Document>
	);
};
