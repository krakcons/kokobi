export const createNestedObject = (key: string, value: any): any => {
	const keys: string[] = key.split("."); // Split the key string into an array of keys

	const result: any = {};
	let currentObj: any = result;

	for (let i = 0; i < keys.length; i++) {
		const currentKey: string = keys[i];
		if (i === keys.length - 1) {
			currentObj[currentKey] = value;
		} else {
			currentObj[currentKey] = {};
			currentObj = currentObj[currentKey];
		}
	}

	return result;
};

export const mergeDeepObjects = (targetObj: any, sourceObj: any): any => {
	for (const key in sourceObj) {
		if (sourceObj.hasOwnProperty(key)) {
			if (
				typeof sourceObj[key] === "object" &&
				!Array.isArray(sourceObj[key]) &&
				sourceObj[key] !== null
			) {
				if (!targetObj[key] || typeof targetObj[key] !== "object") {
					targetObj[key] = {};
				}
				mergeDeepObjects(targetObj[key], sourceObj[key]);
			} else {
				targetObj[key] = sourceObj[key];
			}
		}
	}
	return targetObj;
};

export const addToObject = (obj: any, key: string, value: any): any => {
	const keys = key.split(".");
	let currentObj = obj;

	for (let i = 0; i < keys.length - 1; i++) {
		const currentKey = keys[i];
		if (
			!currentObj[currentKey] ||
			typeof currentObj[currentKey] !== "object"
		) {
			currentObj[currentKey] = {};
		}
		currentObj = currentObj[currentKey];
	}

	const lastKey = keys[keys.length - 1];
	currentObj[lastKey] = value;

	return obj;
};

export const findNestedValue = (key: string, data: any): any => {
	if (!key || key === "") {
		return "";
	}

	const keys: string[] = key.split(".");
	let currentObj: any = { ...data };

	for (const currentKey of keys) {
		if (currentObj.hasOwnProperty(currentKey)) {
			currentObj = currentObj[currentKey];
		} else {
			return "";
		}
	}

	return currentObj;
};

export const formatBytes = (bytes: number): string => {
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	if (bytes === 0) return "n/a";
	const i = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		sizes.length - 1
	);
	if (i === 0) return `${bytes} ${sizes[i]}`;
	return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
};
