export type ScormError = {
	code: number;
	message: {
		short: string;
		diagnostic: string;
	};
};
