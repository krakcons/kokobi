import { Learner } from "@/types/learner";
import { z } from "zod";

export enum Scorm2004ErrorCode {
	NoError = 0,
	GeneralException = 101,
	GeneralInitializationFailure = 102,
	AlreadyInitialized = 103,
	ContentInstanceTerminated = 104,
	GeneralTerminationFailure = 111,
	TerminationBeforeInitialization = 112,
	TerminationAfterTermination = 113,
	RetrieveDataBeforeInitialization = 122,
	RetrieveDataAfterTermination = 123,
	StoreDataBeforeInitialization = 132,
	StoreDataAfterTermination = 133,
	CommitBeforeInitialization = 142,
	CommitAfterTermination = 143,
	GeneralArgumentError = 201,
	GeneralGetFailure = 301,
	GeneralSetFailure = 351,
	GeneralCommitFailure = 391,
	UndefinedDataModelElement = 401,
	UnimplementedDataModelElement = 402,
	DataModelElementValueNotInitialized = 403,
	DataModelElementIsReadOnly = 404,
	DataModelElementIsWriteOnly = 405,
	DataModelElementTypeMismatch = 406,
	DataModelElementValueOutOfRange = 407,
	DataModelDependencyNotEstablished = 408,
}

export const Scorm2004ErrorMessage: Record<
	Scorm2004ErrorCode,
	{ short: string; diagnostic: string }
> = {
	[Scorm2004ErrorCode.NoError]: {
		short: "No error",
		diagnostic: "No error occurred, the previous API call was successful.",
	},
	[Scorm2004ErrorCode.GeneralException]: {
		short: "General Exception",
		diagnostic:
			"No specific error code exists to describe the error. Use GetDiagnostic for more information.",
	},
	[Scorm2004ErrorCode.GeneralInitializationFailure]: {
		short: "General Initialization Failure",
		diagnostic: "Call to Initialize failed for an unknown reason.",
	},
	[Scorm2004ErrorCode.AlreadyInitialized]: {
		short: "Already Initialized",
		diagnostic:
			"Call to Initialize failed because Initialize was already called.",
	},
	[Scorm2004ErrorCode.ContentInstanceTerminated]: {
		short: "Content Instance Terminated",
		diagnostic:
			"Call to Initialize failed because Terminate was already called.",
	},
	[Scorm2004ErrorCode.GeneralTerminationFailure]: {
		short: "General Termination Failure",
		diagnostic: "Call to Terminate failed for an unknown reason.",
	},
	[Scorm2004ErrorCode.TerminationBeforeInitialization]: {
		short: "Termination Before Initialization",
		diagnostic:
			"Call to Terminate failed because it was made before the call to Initialize.",
	},
	[Scorm2004ErrorCode.TerminationAfterTermination]: {
		short: "Termination After Termination",
		diagnostic:
			"Call to Terminate failed because Terminate was already called.",
	},
	[Scorm2004ErrorCode.RetrieveDataBeforeInitialization]: {
		short: "Retrieve Data Before Initialization",
		diagnostic:
			"Call to GetValue failed because it was made before the call to Initialize.",
	},
	[Scorm2004ErrorCode.RetrieveDataAfterTermination]: {
		short: "Retrieve Data After Termination",
		diagnostic:
			"Call to GetValue failed because it was made after the call to Terminate.",
	},
	[Scorm2004ErrorCode.StoreDataBeforeInitialization]: {
		short: "Store Data Before Initialization",
		diagnostic:
			"Call to SetValue failed because it was made before the call to Initialize.",
	},
	[Scorm2004ErrorCode.StoreDataAfterTermination]: {
		short: "Store Data After Termination",
		diagnostic:
			"Call to SetValue failed because it was made after the call to Terminate.",
	},
	[Scorm2004ErrorCode.CommitBeforeInitialization]: {
		short: "Commit Before Initialization",
		diagnostic:
			"Call to Commit failed because it was made before the call to Initialize.",
	},
	[Scorm2004ErrorCode.CommitAfterTermination]: {
		short: "Commit After Termination",
		diagnostic:
			"Call to Commit failed because it was made after the call to Terminate.",
	},
	[Scorm2004ErrorCode.GeneralArgumentError]: {
		short: "General Argument Error",
		diagnostic:
			"An invalid argument was passed to an API method (usually indicates that Initialize, Commit or Terminate did not receive the expected empty string argument).",
	},
	[Scorm2004ErrorCode.GeneralGetFailure]: {
		short: "General Get Failure",
		diagnostic:
			"Indicates a failed GetValue call where no other specific error code is applicable. Use GetDiagnostic for more information.",
	},
	[Scorm2004ErrorCode.GeneralSetFailure]: {
		short: "General Set Failure",
		diagnostic:
			"Indicates a failed SetValue call where no other specific error code is applicable. Use GetDiagnostic for more information.",
	},
	[Scorm2004ErrorCode.GeneralCommitFailure]: {
		short: "General Commit Failure",
		diagnostic:
			"Indicates a failed Commit call where no other specific error code is applicable. Use GetDiagnostic for more information.",
	},
	[Scorm2004ErrorCode.UndefinedDataModelElement]: {
		short: "Undefined Data Model Element",
		diagnostic:
			"The data model element name passed to GetValue or SetValue is not a valid SCORM data model element.",
	},
	[Scorm2004ErrorCode.UnimplementedDataModelElement]: {
		short: "Unimplemented Data Model Element",
		diagnostic:
			"The data model element indicated in a call to GetValue or SetValue is valid, but was not implemented by this LMS. In SCORM 2004, this error would indicate an LMS that is not fully SCORM conformant.",
	},
	[Scorm2004ErrorCode.DataModelElementValueNotInitialized]: {
		short: "Data Model Element Value Not Initialized",
		diagnostic:
			"Attempt to read a data model element that has not been initialized by the LMS or through a SetValue call. This error condition is often reached during normal execution of a SCO.",
	},
	[Scorm2004ErrorCode.DataModelElementIsReadOnly]: {
		short: "Data Model Element Is Read Only",
		diagnostic:
			"SetValue was called with a data model element that can only be read.",
	},
	[Scorm2004ErrorCode.DataModelElementIsWriteOnly]: {
		short: "Data Model Element Is Write Only",
		diagnostic:
			"GetValue was called on a data model element that can only be written to.",
	},
	[Scorm2004ErrorCode.DataModelElementTypeMismatch]: {
		short: "Data Model Element Type Mismatch",
		diagnostic:
			"SetValue was called with a value that is not consistent with the data format of the supplied data model element.",
	},
	[Scorm2004ErrorCode.DataModelElementValueOutOfRange]: {
		short: "Data Model Element Value Out Of Range",
		diagnostic:
			"The numeric value supplied to a SetValue call is outside of the numeric range allowed for the supplied data model element.",
	},
	[Scorm2004ErrorCode.DataModelDependencyNotEstablished]: {
		short: "Data Model Dependency Not Established",
		diagnostic:
			"Some data model elements cannot be set until another data model element was set. This error condition indicates that the prerequisite element was not set before the dependent element.",
	},
};

export const Scorm2004DataSchema = z
	.object({
		"cmi.completion_status": z
			.enum(["completed", "incomplete", "not attempted", "unknown"])
			.default("unknown"),
		"cmi.success_status": z
			.enum(["passed", "failed", "unknown"])
			.default("unknown"),
		"cmi.score.raw": z.coerce.number().default(0),
		"cmi.score.max": z.coerce.number().default(100),
		"cmi.score.min": z.coerce.number().default(0),
	})
	.transform((data) => {
		const statusMapping: Record<string, Learner["status"]> = {
			completed: "completed",
			incomplete: "in-progress",
			"not attempted": "not-started",
			unknown: "not-started",
		};

		const status =
			data["cmi.success_status"] !== "unknown"
				? data["cmi.success_status"]
				: statusMapping[data["cmi.completion_status"]];

		const extended = {
			status,
			score: {
				raw: data["cmi.score.raw"],
				max: data["cmi.score.max"],
				min: data["cmi.score.min"],
			},
		};
		return extended;
	});
