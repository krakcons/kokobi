import { Module } from "@/types/module";

export const getInitialScormData = (
	version: Module["type"]
): Record<string, string> => {
	console.log(version);
	console.log(typeof version);
	if (version === "1.2") {
		return {
			"cmi.core.lesson_status": "not attempted",
			"cmi.core.lesson_location": "0",
			"cmi.core.lesson_mode": "browse",
			"cmi.launch_data": "",
			"cmi.suspend_data": "",
		};
	} else {
		return {
			"cmi.completion_status": "not attempted",
			"cmi.success_status": "unknown",
			"cmi.location": "0",
			"cmi.mode": "browse",
			"cmi.entry": "ab-initio",
			"cmi.suspend_data": "",
		};
	}
};
