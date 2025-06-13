import { Learner } from "@/types/learner";
import { z } from "zod";

export enum Scorm12ErrorCode {
	NoError = 0,
	GeneralException = 101,
	InvalidArgumentError = 201,
	ElementCannotHaveChildren = 202,
	ElementNotAnArray = 203,
	NotInitialized = 301,
	NotImplementedError = 401,
	InvalidSetValueKeyword = 402,
	ElementReadOnly = 403,
	ElementWriteOnly = 404,
	IncorrectDataType = 405,
}

export const Scorm12ErrorMessage: Record<
	Scorm12ErrorCode,
	{ short: string; diagnostic: string }
> = {
	[Scorm12ErrorCode.NoError]: {
		short: "No error",
		diagnostic: "No error occurred, the previous API call was successful.",
	},
	[Scorm12ErrorCode.GeneralException]: {
		short: "General Exception",
		diagnostic:
			"No specific error code exists to describe the error. Use LMSGetDiagnostic for more information.",
	},
	[Scorm12ErrorCode.InvalidArgumentError]: {
		short: "Invalid argument error",
		diagnostic:
			"Indicates that an argument represents an invalid data model element or is otherwise incorrect.",
	},
	[Scorm12ErrorCode.ElementCannotHaveChildren]: {
		short: "Element cannot have children",
		diagnostic:
			'Indicates that LMSGetValue was called with a data model element name that ends in "_children" for a data model element that does not support the "_children" suffix.',
	},
	[Scorm12ErrorCode.ElementNotAnArray]: {
		short: "Element not an array. Cannot have count.",
		diagnostic:
			'Indicates that LMSGetValue was called with a data model element name that ends in "_count" for a data model element that does not support the "_count" suffix.',
	},
	[Scorm12ErrorCode.NotInitialized]: {
		short: "Not initialized",
		diagnostic:
			"Indicates that an API call was made before the call to LMSInitialize.",
	},
	[Scorm12ErrorCode.NotImplementedError]: {
		short: "Not implemented error",
		diagnostic:
			"The data model element indicated in a call to LMSGetValue or LMSSetValue is valid, but was not implemented by this LMS. SCORM 1.2 defines a set of data model elements as being optional for an LMS to implement.",
	},
	[Scorm12ErrorCode.InvalidSetValueKeyword]: {
		short: "Invalid set value, element is a keyword",
		diagnostic:
			'Indicates that LMSSetValue was called on a data model element that represents a keyword (elements that end in "_children" and "_count").',
	},
	[Scorm12ErrorCode.ElementReadOnly]: {
		short: "Element is read only",
		diagnostic:
			"LMSSetValue was called with a data model element that can only be read.",
	},
	[Scorm12ErrorCode.ElementWriteOnly]: {
		short: "Element is write only",
		diagnostic:
			"LMSGetValue was called on a data model element that can only be written to.",
	},
	[Scorm12ErrorCode.IncorrectDataType]: {
		short: "Incorrect Data Type",
		diagnostic:
			"LMSSetValue was called with a value that is not consistent with the data format of the supplied data model element.",
	},
};

export const Scorm12DataSchema = z
	.object({
		"cmi.core.lesson_status": z
			.enum([
				"passed",
				"completed",
				"failed",
				"incomplete",
				"browsed",
				"not attempted",
			])
			.default("not attempted"),
		"cmi.core.score.raw": z.coerce.number().default(0),
		"cmi.core.score.max": z.coerce.number().default(100),
		"cmi.core.score.min": z.coerce.number().default(0),
	})
	.transform((data) => {
		const statusMapping: Record<string, Learner["status"]> = {
			completed: "completed",
			incomplete: "in-progress",
			"not attempted": "not-started",
			browsed: "in-progress",
			passed: "passed",
			failed: "failed",
		};

		const status = statusMapping[data["cmi.core.lesson_status"]];

		return {
			status,
			score: {
				raw: data["cmi.core.score.raw"],
				max: data["cmi.core.score.max"],
				min: data["cmi.core.score.min"],
			},
		};
	});
