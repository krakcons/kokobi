import { buttonVariants } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useMutationOptions } from "@/lib/api";
import { Learner } from "@/types/learner";
import { Module } from "@/types/module";
import {
	Scorm12ErrorCode,
	Scorm12ErrorMessage,
} from "@/types/scorm/versions/12";
import {
	Scorm2004ErrorCode,
	Scorm2004ErrorMessage,
} from "@/types/scorm/versions/2004";
import { useMutation } from "@tanstack/react-query";
import { Link, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useTranslations } from "@/lib/locale";

declare global {
	interface Window {
		API: any;
		API_1484_11: any;
	}
}

const useSCORM = ({
	type,
	initialData,
}: {
	type: Module["type"];
	initialData: Record<string, any>;
}) => {
	const [data, setData] = useState<Record<string, string>>(initialData);
	const error = useRef<number | null>(null);
	const initialized = useRef<boolean>(false);
	const [isApiAvailable, setIsApiAvailable] = useState(false);

	// Log error
	useEffect(() => {
		if (error.current) {
			console.log(
				"Error: ",
				Scorm12ErrorMessage[error.current as Scorm12ErrorCode].short,
			);
		}
	}, [error]);

	console.log("useSCORM", type === "1.2" && typeof window !== "undefined");

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
				console.log("LMSInitialize");

				if (initialized.current) {
					error.current = Scorm12ErrorCode.GeneralException;
					return false;
				}

				initialized.current = true;

				return true;
			},
			LMSCommit: (): boolean => {
				console.log("LMSCommit");

				return true;
			},
			LMSGetValue: (key: string): string => {
				if (!key || key === "") {
					return "";
				}

				const value = data[key] ?? "";

				console.log("LMSGetValue", key, value);

				return `${value}`;
			},
			LMSSetValue: (key: string, value: string): string => {
				console.log("LMSSetValue", key, `${value}`);

				if (!key || key === "") {
					console.log("Error: key is empty", key);
					return "false";
				}

				setData((prev) => {
					return {
						...prev,
						[key]: `${value}`,
					};
				});

				return "true";
			},
			LMSGetLastError: (): number | null => {
				console.log("LMSGetLastError", error ?? null);

				return error.current ?? null;
			},
			LMSGetErrorString: (code: number): string => {
				console.log("LMSGetErrorString", code);
				if (code && Object.values(Scorm12ErrorCode).includes(code)) {
					return Scorm12ErrorMessage[code as Scorm12ErrorCode].short;
				} else {
					return "";
				}
			},
			LMSGetDiagnostic: (code: number): string => {
				console.log("LMSGetDiagnostic", code);
				if (code && Object.values(Scorm12ErrorCode).includes(code)) {
					return Scorm12ErrorMessage[code as Scorm12ErrorCode]
						.diagnostic;
				} else {
					return "";
				}
			},
			LMSFinish: (): boolean => {
				console.log("LMSFinish");

				return true;
			},
		};
	} else if (type === "2004" && typeof window !== "undefined") {
		window.API_1484_11 = {
			Initialize: (): boolean => {
				console.log("Initialize");

				if (initialized.current) {
					error.current = Scorm2004ErrorCode.AlreadyInitialized;
					return false;
				}

				initialized.current = true;

				return true;
			},
			Commit: (): boolean => {
				console.log("Commit");

				return true;
			},
			GetValue: (key: string): string => {
				if (!key || key === "") {
					return "";
				}

				const value = data[key];

				console.log("GetValue", key, value);

				if (value === undefined) {
					error.current = Scorm2004ErrorCode.GeneralGetFailure;
					console.log("Error: couldn't find value for key", key);
				}

				return `${value}`;
			},
			SetValue: (key: string, value: string): string => {
				console.log("SetValue", key, value);
				if (!key || key === "") {
					console.log("Error: key is empty", key);
					return "false";
				}

				setData((prev) => {
					return {
						...prev,
						[key]: `${value}`,
					};
				});

				return "true";
			},
			GetLastError: (): number | null => {
				console.log("GetLastError", error ?? null);

				return error.current ?? null;
			},
			GetErrorString: (code: number): string => {
				console.log("GetErrorString", code);
				if (code && Object.values(Scorm2004ErrorCode).includes(code)) {
					return Scorm2004ErrorMessage[code as Scorm2004ErrorCode]
						.short;
				} else {
					return "";
				}
			},
			GetDiagnostic: (code: number): string => {
				console.log("GetDiagnostic", code);
				if (code && Object.values(Scorm2004ErrorCode).includes(code)) {
					return Scorm2004ErrorMessage[code as Scorm2004ErrorCode]
						.diagnostic;
				} else {
					return "";
				}
			},
			Terminate: (): boolean => {
				console.log("Terminate");

				return true;
			},
		};
	}

	return { data, isApiAvailable };
};

const LMSProvider = ({
	type,
	learner,
	course,
	url,
}: {
	type: Module["type"];
	learner: Learner;
	url: string;
	course: string;
}) => {
	const t = useTranslations("Certificate");
	const [loading, setLoading] = useState(true);
	const [certOpen, setCertOpen] = useState(false);

	// Course completion status
	const [completed, setCompleted] = useState(!!learner.completedAt);

	// Scorm wrapper
	const { data, isApiAvailable } = useSCORM({
		type,
		initialData: learner.data,
	});

	// Update learner mutation
	const mutationOptions = useMutationOptions();
	const { mutate } = useMutation(mutationOptions.course.learners.update);

	useEffect(() => {
		const hidden = localStorage.getItem(learner.id);
		if (completed && !hidden) {
			setCertOpen(true);
		}
	}, [completed, learner.id]);

	useEffect(() => {
		if (!completed) {
			mutate(
				{
					param: { id: learner.courseId, learnerId: learner.id },
					json: { data },
				},
				{
					onSuccess: async ({ completedAt }) => {
						const hidden = localStorage.getItem(learner.id);
						if (!!completedAt && !hidden) {
							setCompleted(true);
						}
					},
				},
			);
		}
	}, [data, completed, mutate, learner]);

	const { pathname } = useLocation();

	return (
		<>
			<Dialog onOpenChange={(open) => setCertOpen(open)} open={certOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{course} {t.dialog.title}
						</DialogTitle>
						<DialogDescription>
							{t.dialog.description}
						</DialogDescription>
					</DialogHeader>
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							onChange={(e) => {
								if (e.target.checked) {
									localStorage.setItem(learner.id, "true");
								} else {
									localStorage.removeItem(learner.id);
								}
							}}
						/>
						<p className="text-sm">{t.dialog["dont-show"]}</p>
					</label>
					<Link
						href={`${pathname}/certificate?learnerId=${learner.id}`}
						className={buttonVariants()}
					>
						{t.download}
					</Link>
				</DialogContent>
			</Dialog>
			{loading && (
				<div className="absolute flex h-screen w-screen items-center justify-center bg-background">
					<Loader2 size={48} className="animate-spin" />
				</div>
			)}
			{isApiAvailable && (
				<iframe
					src={url}
					className="flex-1"
					onLoad={() => setLoading(false)}
				/>
			)}
		</>
	);
};

export default LMSProvider;
