import { Certificate, CertificateProps } from "@/components/Certificate";
import { PDFViewer } from "@react-pdf/renderer";

const PDFView = ({ certificate }: { certificate: CertificateProps }) => {
	return (
		<PDFViewer className="h-[700px] w-full">
			<Certificate {...certificate} />
		</PDFViewer>
	);
};

export default PDFView;
