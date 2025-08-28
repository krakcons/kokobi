import type { Module } from "@/types/module";
import {
	Scorm12ErrorCode,
	Scorm12ErrorMessage,
} from "@/types/scorm/versions/12";
import {
	Scorm2004ErrorCode,
	Scorm2004ErrorMessage,
} from "@/types/scorm/versions/2004";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
	interface Window {
		API: any;
		API_1484_11: any;
	}
}

export const useLMS = ({
	type,
	initialData,
	onDataChange,
	debug = false,
}: {
	type: Module["type"];
	initialData: Record<string, string>;
	onDataChange: (data: Record<string, string>) => void;
	debug?: boolean;
}) => {
	const onDataChangeRef = useRef(onDataChange);
	const [data, setData] = useState(initialData);
	const error = useRef<number | null>(null);
	const initialized = useRef<boolean>(false);
	const [isApiAvailable, setIsApiAvailable] = useState(false);

	const log = useCallback(
		(...data: any[]) => {
			if (debug) {
				console.log(data);
			}
		},
		[debug],
	);

	// Update onDataChange callback on change
	useEffect(() => {
		onDataChangeRef.current = onDataChange;
	}, [onDataChange]);

	// Log error
	useEffect(() => {
		if (error.current) {
			log(
				"Error: ",
				Scorm12ErrorMessage[error.current as Scorm12ErrorCode].short,
			);
		}
	}, [error]);

	useEffect(() => {
		const checkApiAvailability = () => {
			if (
				typeof window !== "undefined" &&
				(window.API || window.API_1484_11)
			) {
				setIsApiAvailable(true);
			} else {
				// Retry after a short delay if API is not available yet
				setTimeout(checkApiAvailability, 50);
			}
		};

		checkApiAvailability();
	}, []);

	if (type === "1.2" && typeof window !== "undefined") {
		window.API = {
			LMSInitialize: (): boolean => {
				log("LMSInitialize");

				if (initialized.current) {
					error.current = Scorm12ErrorCode.GeneralException;
					return false;
				}

				initialized.current = true;

				return true;
			},
			LMSCommit: (): boolean => {
				log("LMSCommit");

				return true;
			},
			LMSGetValue: (key: string): string => {
				if (!key || key === "") {
					return "";
				}

				const value = data[key] ?? "";

				log("LMSGetValue", key, value);

				return `${value}`;
			},
			LMSSetValue: (key: string, value: string): string => {
				log("LMSSetValue", key, `${value}`);

				if (!key || key === "") {
					log("Error: key is empty", key);
					return "false";
				}

				setData((oldData) => {
					const newData = {
						...oldData,
						[key]: `${value}`,
					};
					onDataChangeRef.current(newData);
					return newData;
				});

				return "true";
			},
			LMSGetLastError: (): number | null => {
				log("LMSGetLastError", error ?? null);

				return error.current ?? null;
			},
			LMSGetErrorString: (code: number): string => {
				log("LMSGetErrorString", code);
				if (code && Object.values(Scorm12ErrorCode).includes(code)) {
					return Scorm12ErrorMessage[code as Scorm12ErrorCode].short;
				} else {
					return "";
				}
			},
			LMSGetDiagnostic: (code: number): string => {
				log("LMSGetDiagnostic", code);
				if (code && Object.values(Scorm12ErrorCode).includes(code)) {
					return Scorm12ErrorMessage[code as Scorm12ErrorCode]
						.diagnostic;
				} else {
					return "";
				}
			},
			LMSFinish: (): boolean => {
				log("LMSFinish");

				return true;
			},
		};
	} else if (type === "2004" && typeof window !== "undefined") {
		window.API_1484_11 = {
			Initialize: (): boolean => {
				log("Initialize");

				if (initialized.current) {
					error.current = Scorm2004ErrorCode.AlreadyInitialized;
					return false;
				}

				initialized.current = true;

				return true;
			},
			Commit: (): boolean => {
				log("Commit");

				return true;
			},
			GetValue: (key: string): string => {
				if (!key || key === "") {
					return "";
				}

				const value = data[key];

				log("GetValue", key, value);

				if (value === undefined) {
					error.current = Scorm2004ErrorCode.GeneralGetFailure;
					log("Error: couldn't find value for key", key);
				}

				return `${value}`;
			},
			SetValue: (key: string, value: string): string => {
				log("SetValue", key, value);
				if (!key || key === "") {
					log("Error: key is empty", key);
					return "false";
				}

				setData((oldData) => {
					const newData = {
						...oldData,
						[key]: `${value}`,
					};
					onDataChangeRef.current(newData);
					return newData;
				});

				return "true";
			},
			GetLastError: (): number | null => {
				log("GetLastError", error ?? null);

				return error.current ?? null;
			},
			GetErrorString: (code: number): string => {
				log("GetErrorString", code);
				if (code && Object.values(Scorm2004ErrorCode).includes(code)) {
					return Scorm2004ErrorMessage[code as Scorm2004ErrorCode]
						.short;
				} else {
					return "";
				}
			},
			GetDiagnostic: (code: number): string => {
				log("GetDiagnostic", code);
				if (code && Object.values(Scorm2004ErrorCode).includes(code)) {
					return Scorm2004ErrorMessage[code as Scorm2004ErrorCode]
						.diagnostic;
				} else {
					return "";
				}
			},
			Terminate: (): boolean => {
				log("Terminate");

				return true;
			},
		};
	}

	return { isApiAvailable, data };
};
