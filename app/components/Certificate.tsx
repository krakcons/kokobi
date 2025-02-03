"use client";

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

Font.registerHyphenationCallback((word) => ["", word, ""]);

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
	teamName: string;
	logo?: string;
	text: {
		title: string;
		message: string;
		congratulations: {
			1: string;
			2: string;
		};
		date: string;
	};
};

export const Certificate = ({
	name,
	course,
	completedAt,
	teamName,
	text,
	logo,
}: CertificateProps) => {
	return (
		<Document>
			<PDFPage size="A4" orientation="landscape" style={styles.page}>
				{/* eslint-disable-next-line jsx-a11y/alt-text */}
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
				<Text style={[styles.h1, { marginTop: 15 }]}>{text.title}</Text>
				<Text>{text.message}</Text>
				<Text
					style={[
						styles.h1,
						{
							borderBottom: "1px solid black",
						},
					]}
				>
					{" " +
						name +
						" "}
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
							{text.congratulations[1]}
						</Text>
						<Text
							style={{
								fontWeight: 600,
								fontStyle: "italic",
							}}
						>
							{" " + course}
						</Text>
						<Text
							style={{
								fontStyle: "italic",
							}}
						>
							{" " + text.congratulations[2]}
						</Text>
						<Text
							style={{
								fontWeight: 600,
								fontStyle: "italic",
							}}
						>
							{" " + teamName}.
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
					<Text>{text.date}</Text>
				</View>
				{logo && (
					/* eslint-disable-next-line jsx-a11y/alt-text */
					<Image
						src={logo}
						style={{
							height: 50,
							objectFit: "contain",
						}}
					/>
				)}
			</PDFPage>
		</Document>
	);
};
