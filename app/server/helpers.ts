import { generateRandomString, type RandomReader } from "@oslojs/crypto/random";

const random: RandomReader = {
	read(bytes) {
		crypto.getRandomValues(bytes);
	},
};

export function generateId(length: number, alphabet?: string): string {
	return generateRandomString(
		random,
		alphabet ?? "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
		length
	);
}
