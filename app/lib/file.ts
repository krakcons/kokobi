export const fetchFile = async (fileUrl: string): Promise<File | ""> => {
	const response = await fetch(fileUrl);
	if (!response.ok) {
		return "";
	}
	const blob = await response.blob();
	const filename = fileUrl.split("/").pop(); // Extract filename from URL
	return new File([blob], filename!, { type: blob.type });
};
