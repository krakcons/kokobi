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
			congratulations: "Congratulations! you have successfully completed",
			offered: "Offered by",
			created: "Created by",
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
		OTP: {
			subject: "Email Verification Code",
			content: "Here is your verification code:",
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
			admin: "Switch to Admin",
			learner: "Switch to Learning",
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
		rejected: "You have rejected the invite",
		adminRejected: "An admin has rejected your request",
	},
	Errors: {
		title: "Something went wrong!",
		tryAgain: "Try Again",
		goBack: "Go Back",
		NotFound: {
			title: "404",
			message: "The page you are looking for does not exist.",
			home: "Home",
		},
	},
	NotAMember: {
		title: "Not an admin",
		message:
			"You haven't been invited to administer this team. Please contact a team administrator and request an invitation to get access to the team's administration dashboard.",
		inviteMessage:
			"You have been invited to administer this team. Accept or decline the invitation below.",
	},
};

export default en;
