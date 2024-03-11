"use client";

import { enUS } from "@clerk/localizations";

export const localization = {
	...enUS,
	formFieldLabel__organizationName: "Team Name",
	organizationProfile: {
		start: {
			headerSubtitle__members: "View and manage team members",
			headerSubtitle__settings: "Manage team settings",
		},
		profilePage: {
			title: "Team Profile",
			subtitle: "Manage team profile",
			dangerSection: {
				leaveOrganization: {
					title: "Leave Team",
					messageLine1:
						"Are you sure you want to leave this team? You will lose access to this team and its applications.",
					successMessage: "You have left the team.",
				},
				deleteOrganization: {
					title: "Delete Team",
					messageLine1: "Are you sure you want to delete this team?",
					successMessage: "You have deleted the team.",
				},
			},
			domainSection: {
				subtitle:
					"Allow users to join the team automatically or request to join based on a verified email domain.",
			},
		},
		createDomainPage: {
			subtitle:
				"Add the domain to verify. Users with email addresses at this domain can join the team automatically or request to join.",
		},
		verifiedDomainPage: {
			enrollmentTab: {
				subtitle:
					"Choose how users from this domain can join the team.",
				manualInvitationOption__description:
					"Users can only be invited manually to the team.",
				automaticInvitationOption__description:
					"Users are automatically invited to join the team when they sign-up and can join anytime.",
				automaticSuggestionOption__description:
					"Users receive a suggestion to request to join, but must be approved by an admin before they are able to join the team.",
			},
		},
		invitePage: {
			subtitle: "Invite new members to this team",
		},
		removeDomainPage: {
			messageLine2:
				"Users won’t be able to join the team automatically after this.",
		},
		membersPage: {
			invitationsTab: {
				autoInvitations: {
					headerSubtitle:
						"Invite users by connecting an email domain with your team. Anyone who signs up with a matching email domain will be able to join the team anytime.",
				},
			},
			requestsTab: {
				requests: {
					headerSubtitle:
						"Browse and manage users who requested to join the team.",
				},
				autoSuggestions: {
					headerSubtitle:
						"Users who sign up with a matching email domain, will be able to see a suggestion to request to join your team.",
				},
			},
		},
	},
	createOrganization: {
		title: "Create Team",
		formButtonSubmit: "Create Team",
	},
	organizationList: {
		createOrganization: "Create Team",
		titleWithoutPersonal: "Select a Team",
		action__createOrganization: "Create Team",
	},
};
