const en = {
	AdminSidebar: {
		top: {
			editing: "Editing",
		},
		sidebar: {
			manage: "Manage",
			dashboard: "Dashboard",
			team: "Team",
			edit: "Edit Team",
			apiKeys: "API Keys",
			certificate: "Certificate",
			domains: "Domains",
			members: "Members",
		},
	},
	LearnerSidebar: {
		dashboard: "Dashboard",
		"available-courses": "Available Courses",
		courses: "Courses",
		collections: "Collections",
	},
	LearnerDashboard: {
		title: "Dashboard",
		description:
			"View all your courses, collections, attempts, and certificates",
	},
	Home: {
		title: { "1": "Modern Learning", "2": "For Less" },
		description:
			"Discover modern, affordable, and easy learning management for an empowering educational experience.",
		"team-description":
			"Visit either the learning or admin portal to get started.",
		"go-to-admin": "Go to Admin",
		"go-to-learning": "Go to Learning",
	},
	Join: {
		"0": { title: "Join" },
		"1": { title: "Your Info" },
		continue: "Continue",
		join: "Join",
		back: "Back",
		language: "Language",
		"language-description":
			"Once you join you will not be able to change the language, and you will have to re-register (or request a new invitation) in order to do so.",
	},
	Form: {
		learner: {
			firstName: "First Name",
			lastName: "Last Name",
			email: "Email",
		},
		optional: "Optional",
		submit: "Submit",
		blockNavigation: {
			title: "Leave without saving?",
			description:
				"Your changes have not been saved. If you leave, you will lose your changes.",
			confirm: "Confirm",
			cancel: "Cancel",
		},
	},
	Certificate: {
		fileName: "certificate.pdf",
		title: "Certificate of Completion",
		message: "This is to certify that you have successfully completed",
		download: "Download Certificate",
		"no-name": "Certificate Requires Name",
		pdf: {
			title: "Certificate of Completion",
			message: "This certificate is proudly awarded to",
			congratulations: {
				"1": "Congratulations! you have successfully completed",
				"2": "offered by",
			},
			date: "Date of Completion",
		},
	},
	Email: {
		CourseCompletion: {
			subject: "Course Completion",
			title: "Congratulations!",
			completed: "Completed",
			by: "offered by",
			congratulations: "Congratulations! You have completed",
			certificate: "Download your certificate of completion:",
			get: "Download",
		},
		Invite: {
			subject: "Invitation",
			title: "Invitation",
			invite: "invites you to join the following:",
			action: "View Invitation",
		},
	},
	Table: {
		empty: "No results.",
		filter: "Filter results...",
		sort: {
			asc: "Asc",
			desc: "Desc",
			hide: "Hide",
		},
		name: "Name",
		status: "Status",
		rowsPerPage: "Rows per page",
		page: "Page",
		of: "of",
		goToFirstPage: "Go to first page",
		goToPreviousPage: "Go to previous page",
		goToNextPage: "Go to next page",
		goToLastPage: "Go to last page",
	},
	Learner: {
		statuses: {
			completed: "Completed",
			"not-started": "Not Started",
			"in-progress": "In Progress",
			passed: "Passed",
			failed: "Failed",
		},
		status: "Status",
		score: "Score",
		startedAt: "Started At",
		completedAt: "Completed At",
	},
	Role: {
		owner: "Owner",
		admin: "Admin",
		member: "Member",
	},
	CompletionStatuses: {
		passed: "Passed",
		completed: "Completed",
		either: "Passed/Completed",
	},
	ConnectionActions: {
		accept: "Accept",
		reject: "Reject",
	},
	ConnectionStatuses: {
		accepted: "Accepted",
		pending: "Pending",
		rejected: "Rejected",
	},
	ConnectionTypes: {
		invite: "Invite",
		request: "Request",
	},
	Login: {
		title: "Login",
		description: "Enter your email below and submit to login",
	},
	VerifyEmail: {
		title: "Verify Email",
		description: "Enter the code we sent you to verify your email",
	},
	UserButton: {
		theme: {
			label: "Theme",
			light: "Light",
			dark: "Dark",
			system: "System",
		},
		account: "Account",
		switch: {
			admin: "Switch to admin",
			learner: "Switch to learning",
		},
		signout: "Sign out",
	},
	TeamSwitcher: {
		title: "Teams",
		create: "Create team",
	},
	Course: {
		start: "Start",
		continue: "Continue",
	},
	LoginForm: {
		email: {
			label: "Email",
		},
	},
	VerifyEmailForm: {
		code: {
			label: "Code",
		},
	},
	UserForm: {
		title: "Account",
		description: "Manage your account settings.",
		firstName: {
			label: "First Name",
		},
		lastName: {
			label: "Last Name",
		},
	},
	ConnectionWrapper: {
		invited: "You have been invited to",
		request: "Would you like to request access to",
		requested: "Requested access, please wait for an admin to approve.",
		rejected: "An admin has rejected your request",
	},
};

export default en;
