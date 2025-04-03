import { PDFViewer } from "@react-pdf/renderer";
import { Certificate, CertificateProps } from "./Certificate";

const CertificatePDF = ({ certificate }: { certificate: CertificateProps }) => {
	return (
		<PDFViewer className="h-[700px] w-full">
			<Certificate {...certificate} />
		</PDFViewer>
	);
};

export default CertificatePDF;
