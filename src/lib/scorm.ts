import type { Course } from "@/types/course";
import type { Learner } from "@/types/learner";
import type { Module } from "@/types/module";

export const isModuleSuccessful = ({
	completionStatus,
	status,
}: {
	completionStatus: Course["completionStatus"];
	status: Learner["status"];
}): boolean => {
	return completionStatus === "either"
		? ["completed", "passed"].includes(status)
		: completionStatus === status;
};

export const getInitialScormData = (
	version: Module["type"],
): Record<string, string> => {
	if (version === "1.2") {
		return {
			"cmi.core.lesson_status": "browsed",
			"cmi.core.lesson_location": "0",
			"cmi.core.lesson_mode": "browse",
			"cmi.launch_data": "",
			"cmi.suspend_data": "",
		};
	} else {
		return {
			"cmi.completion_status": "incomplete",
			"cmi.success_status": "unknown",
			"cmi.location": "0",
			"cmi.mode": "browse",
			"cmi.entry": "ab-initio",
			"cmi.suspend_data": "",
		};
	}
};
