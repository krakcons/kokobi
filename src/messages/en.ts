const en = {
	Actions: {
		title: "Actions",
		delete: "Delete",
		create: "Create",
		cancel: "Cancel",
		continue: "Continue",
	},
	AdminSidebar: {
		switchToLearner: "Switch to Learner",
		editing: "Editing",
		manage: "Manage",
		dashboard: "Dashboard",
		organization: "Organization",
		edit: "Edit Organization",
		apiKeys: "API Keys",
		certificate: "Certificate",
		domains: "Domains",
		members: "Members",
		courses: "Courses",
		createCourse: "Create Course",
		collections: "Collections",
		createCollection: "Create Collection",
		settings: "Settings",
		learners: "Learners",
		statistics: "Statistics",
		sharing: "Sharing",
	},
	AdminDashboard: {
		title: "Dashboard",
		description:
			"Welcome to the dashboard. Within this admin portal you will be able to create and manage courses, invite learners, and more.",
		course: {
			title: "Create your first course",
			description:
				"Courses allow you to share learning materials according to the Scorm 1.2 and 2004 standards",
		},
		collection: {
			title: "Create your first collection",
			description: "Collections are a way to organize a list of courses.",
		},
	},
	AuthLoginForm: {
		email: "Email",
		rememberMe: "Remember me",
	},
	AuthLogin: {
		title: "Login",
		description: "Enter your email below and submit to login",
	},
	AuthVerifyEmail: {
		title: "Verify Email",
		description: "Enter the code we sent you to verify your email",
	},
	AuthVerifyEmailForm: {
		code: {
			label: "Code",
		},
	},
	APIKeys: {
		title: "API Keys",
		description:
			"API keys allow you to access your Kokobi instance from external applications using a REST API.",
		table: {
			name: "Name",
			key: "Key",
		},
	},
	APIKeyForm: {
		title: "Create API Key",
		description: "Enter the key name below.",
		name: "Name",
	},
	CourseSettings: {
		title: "Settings",
		description: "Edit your course settings",
		delete: {
			title: "Delete Course",
			description:
				"This will delete the course and all associated data. This action cannot be undone.",
			confirm: {
				title: "Are you absolutely sure?",
				description:
					"This action cannot be undone. This will permanently delete your course and remove all related data (ex. modules, learners, etc) from our servers.",
			},
		},
	},
	Certificate: {
		fileName: "certificate.pdf",
		title: "Certificate of Completion",
		description: "View a preview of how your certificate will look.",
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
	ConnectionWrapper: {
		invited: "You have been invited to",
		request: "Would you like to request access to",
		requested: "Requested access, please wait for an admin to approve.",
		rejected: "You have rejected the invite",
		adminRejected: "An admin has rejected your request",
	},
	Course: {
		start: "Start",
		continue: "Continue",
		review: "Review",
	},
	CourseForm: {
		name: "Name",
		description: "Description",
		create: {
			title: "Create Course",
			description: "Enter the details of your course below.",
		},
		completionStatus: {
			label: "Completion Status",
			description:
				"When the course is considered completed. Certificate is issued and course is locked.",
		},
	},
	CoursesForm: {
		title: "Add Courses",
		description: "Select all the courses you want below.",
		empty: "No courses available. Create a course first here.",
		create: "Create Course",
	},
	CollectionForm: {
		name: "Name",
		description: "Description",
		updated: "Collection updated successfully.",
		create: {
			title: "Create Collection",
			description: "Enter the details of your collection below.",
		},
	},
	CollectionCourses: {
		title: "Courses",
		description: "Manage courses for this collection.",
		table: {
			name: "Name",
			description: "Description",
		},
	},
	CollectionSettings: {
		title: "Settings",
		description: "Edit your collection settings",
		delete: {
			title: "Delete Collection",
			description:
				"This will delete the collection and all associated data. This action cannot be undone.",
			confirm: {
				title: "Are you absolutely sure?",
				description:
					"This action cannot be undone. This will permanently delete your collection and remove all related data (ex. courses, learners, etc) from our servers.",
			},
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
	Form: {
		optional: "Optional",
		submit: "Submit",
		suggestedImageSize: "Suggested image size:",
		otherSettings: "Other settings",
		blockNavigation: {
			title: "Leave without saving?",
			description:
				"Your changes have not been saved. If you leave, you will lose your changes.",
			confirm: "Confirm",
			cancel: "Cancel",
		},
		accepts: "Accepts:",
	},
	Home: {
		title: { "1": "Modern Learning", "2": "For Less" },
		description:
			"Discover modern, affordable, and easy learning management for an empowering educational experience.",
		"organization-description":
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
	Learners: {
		title: "Learners",
		description: "Manage your learners",
	},
	LearnerSidebar: {
		switchToAdmin: "Switch to Admin",
		dashboard: "Dashboard",
		"available-courses": "Available Courses",
		courses: "Courses",
		collections: "Collections",
	},
	LearnerDashboard: {
		title: "Dashboard",
		description:
			"View all your courses, collections, attempts, and certificates",
		course: {
			title: "No courses available",
			description:
				"You haven't joined any courses yet. To join a course, request access from a organization or get an organization to invite you.",
		},
		collection: {
			title: "No collections available",
			description:
				"You haven't joined any collections yet. To join a collection, request access from a organization or get an organization to invite you.",
		},
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
		resend: "Resend Invite",
		recertify: "Resend Completion",
		moduleLocale: "Locale",
		moduleVersion: "Version",
		connectedAt: "Invited/Requested At",
		connectStatus: "Connection Status",
	},
	LearnersForm: {
		title: "Invite Learners",
		description:
			"Enter emails below and submit to invite them new learners.",
		add: "Add Email",
	},
	Locales: {
		en: "English",
		fr: "French",
	},
	Members: {
		title: "Members",
		description: "Manage members and access levels",
		create: "Create Member",
		edit: "Edit",
		remove: "Remove",
		type: {
			member: "Active",
			invite: "Invite",
		},
		status: {
			canceled: "Canceled",
			accepted: "Accepted",
			pending: "Pending",
			rejected: "Rejected",
		},
		table: {
			name: "Name",
			email: "Email",
			status: "Status",
			role: "Role",
			access: "Access",
		},
	},
	MemberForm: {
		title: "Member",
		description: "Manage member settings.",
		email: "Email",
		role: "Role(s)",
	},
	MemberCreate: {
		title: "Invite Member",
		description: "Invite a new member to your organization.",
	},
	MemberEdit: {
		title: "Edit Member",
		description: "Edit this members role and access",
		toast: "Member role updated",
	},
	Modules: {
		title: "Modules",
		description:
			"Manage the modules for this course. Modules are the actual content of the course in the Scorm 1.2 and 2004 standards.",
		table: {
			version: "Version",
			locale: "Locale",
			type: "Type",
		},
	},
	ModuleForm: {
		title: "Create Module",
		description: "Upload a scorm module below.",
		file: "File",
	},
	NotAMember: {
		title: "Not an admin",
		message:
			"You haven't been invited to administer this organization. Please contact a organization administrator and request an invitation to get access to the organization's administration dashboard.",
		inviteMessage:
			"You have been invited to administer this organization. Accept or decline the invitation below.",
	},
	SEO: {
		title: "Kokobi | Learn, Teach, Connect and Grow",
	},
	Statistics: {
		title: "Statistics",
		description: "View your course statistics",
		filter: {
			title: "Filter by Organization",
			all: "All Organizations",
		},
		totalAttempts: {
			title: "Total Attempts",
			description: "Total learners that have started this course.",
		},
		totalCompletions: {
			title: "Total Completed",
			description: "Total learners who have completed this course.",
		},
		averageCompletionTime: {
			title: "Average Completion Time",
			description: "Average time it takes to complete this course.",
			minutes: "minutes",
		},
		attemptStatus: {
			title: "Attempt Status",
			description: "Total learners with each status",
		},
	},
	Sharing: {
		title: "Sharing",
		description: "Manage who can deliver this course",
		table: {
			name: "Name",
			status: "Status",
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
	OrganizationSettings: {
		title: "Settings",
		description: "Edit your organization settings",
		domain: {
			rootWarning:
				"Record names are relative to your root domain (ex. 'email' corresponds to 'email.domain.com')",
			status: "Status",
			type: "Type",
			name: "Name",
			value: "Value",
			priority: "Priority:",
			delete: {
				confirm: {
					title: "Are you absolutely sure?",
					description:
						"This action cannot be undone. This will permanently delete your domain and break any link previously sent with this domain (ex. invitatations, share link, completion, etc).",
				},
			},
		},
		delete: {
			title: "Delete Organization",
			description:
				"This will delete the organization and all associated data. This action cannot be undone.",
			confirm: {
				title: "Are you absolutely sure?",
				description:
					"This action cannot be undone. This will permanently delete your organization and remove all your data (ex. collections, courses, learners, etc) from our servers.",
			},
		},
	},
	OrganizationSwitcher: {
		title: "Organizations",
		create: "Create organization",
	},
	OrganizationsForm: {
		title: "Invite Organizations",
		description:
			"Enter the identifiers of the organizations you want to invite.",
		add: "Add Organization",
	},
	OrganizationForm: {
		name: "Name",
		logo: "Logo",
		favicon: "Favicon",
		create: {
			title: "Create Organization",
			description: "Enter the details of your organization below.",
		},
	},
	OrganizationDomainForm: {
		title: "Custom Domain",
		description: "Set a custom domain to serve your organization's content",
		domain: "Domain",
	},
	Role: {
		owner: "Owner",
		admin: "Admin",
		member: "Member",
	},
	User: {
		email: "Email",
		name: "Name",
	},
	UserForm: {
		title: "Account",
		description: "Manage your account settings.",
		name: "Name",
		image: "Image",
	},
	UserButton: {
		theme: {
			label: "Theme",
			light: "Light",
			dark: "Dark",
			system: "System",
		},
		account: "Account",
		signout: "Sign out",
	},
};

export default en;
