export const generateRandomString = (
	length: number | undefined = 20,
	alphabet:
		| string
		| undefined = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
) => {
	const alphabetLength = alphabet.length;
	const str = new Array(length); // Pre-allocate array for efficiency

	// Fill the array with random characters
	for (let i = 0; i < length; i++) {
		const randomByte = crypto.getRandomValues(new Uint8Array(1))[0]; // Get a single random byte
		const randomIndex = randomByte % alphabetLength; // Map byte to alphabet index
		str[i] = alphabet[randomIndex];
	}

	return str.join(""); // Join the array into a string
};
