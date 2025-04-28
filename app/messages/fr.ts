import { Messages } from "@/lib/locale";

const fr: Messages = {
	AdminSidebar: {
		top: {
			editing: "Édition",
		},
		sidebar: {
			manage: "Gérer",
			dashboard: "Tableau de bord",
			team: "Équipe",
			edit: "Modifier l'équipe",
			apiKeys: "Clés API",
			certificate: "Certificat",
			domains: "Domaines",
			members: "Membres",
		},
	},
	LearnerSidebar: {
		dashboard: "Tableau de bord",
		"available-courses": "Cours disponibles",
		courses: "Cours",
		collections: "Collections",
	},
	LearnerDashboard: {
		title: "Tableau de bord",
		description:
			"Consultez tous vos cours, collections, tentatives et certificats",
	},
	Home: {
		title: { "1": "Apprentissage moderne", "2": "Moins cher" },
		description:
			"Découvrez une gestion de l'apprentissage moderne, abordable et facile pour une expérience éducative enrichissante.",
		"team-description":
			"Visitez le portail d'apprentissage ou d'administration pour commencer.",
		"go-to-admin": "Aller à l'administration",
		"go-to-learning": "Aller à l'apprentissage",
	},
	Join: {
		"0": { title: "S'inscrire" },
		"1": { title: "Vos informations" },
		continue: "Continuer",
		join: "S’inscrire",
		back: "Retour",
		language: "Langue",
		"language-description":
			"Une fois inscrit, vous ne pourrez pas changer de langue et vous devrez vous réinscrire (ou demander une nouvelle invitation) pour le faire.",
	},
	Form: {
		learner: {
			firstName: "Prénom",
			lastName: "Nom de famille",
			email: "Courriel",
		},
		optional: "En option",
		submit: "Soumettre",
		blockNavigation: {
			title: "Quitter sans sauvegarder?",
			description:
				"Vos modifications n'ont pas été sauvegardés. Si vous quittez, vous perdrez vos modifications.",
			confirm: "Confirmer",
			cancel: "Annuler",
		},
	},
	Certificate: {
		fileName: "certificat.pdf",
		title: "Certificat de réussite",
		message: "La présente atteste que vous avez suivi avec succès",
		download: "Télécharger le certificat",
		"no-name": "Le certificat nécessite un nom",
		pdf: {
			title: "Certificat de réussite",
			message: "Nouse sommes fiers de remettre ce certificat à",
			congratulations: "Félicitations ! Vous avez terminé avec succès",
			date: "Date d'achèvement",
			offered: "Offert par",
			created: "Créé par",
		},
	},
	Email: {
		CourseCompletion: {
			subject: "Achèvement du cours",
			title: "Félicitations !",
			completed: "Complété",
			congratulations: "Félicitations ! Vous avez complété",
			by: "offert par",
			certificate: "Téléchargez votre certificat de réussite :",
			get: "Télécharger",
		},
		Invite: {
			subject: "Invitation",
			title: "Invitation",
			invite: "vous invite à vous joindre à :",
			action: "Voir l'invitation",
		},
		OTP: {
			subject: "Code de vérification de l'e-mail",
			content: "Voici votre code de vérification :",
		},
	},
	Table: {
		name: "Nom",
		status: "Statut",
		empty: "Aucun résultat.",
		filter: "Filtrer les résultats...",
		sort: {
			asc: "Croissant",
			desc: "Décroissant",
			hide: "Cacher",
		},
		rowsPerPage: "Lignes par page",
		page: "Page",
		of: "de",
		goToFirstPage: "Aller à la première page",
		goToPreviousPage: "Aller à la page précédente",
		goToNextPage: "Aller à la page suivante",
		goToLastPage: "Aller à la dernière page",
	},
	Learner: {
		statuses: {
			completed: "Terminé",
			"not-started": "Non démarré",
			"in-progress": "En cours",
			passed: "Réussi",
			failed: "Échec",
		},
		status: "Statut",
		score: "Score",
		startedAt: "Commencé à",
		completedAt: "Terminé à",
	},
	Role: {
		owner: "Propriétaire",
		admin: "Administrateur",
		member: "Membre",
	},
	CompletionStatuses: {
		passed: "Passé",
		completed: "Complété",
		either: "Passé/Complété",
	},
	ConnectionActions: {
		accept: "Accepter",
		reject: "Rejeter",
	},
	ConnectionStatuses: {
		accepted: "Accepté",
		pending: "En attente",
		rejected: "Rejetée",
	},
	ConnectionTypes: {
		invite: "Inviter",
		request: "Demande",
	},
	Login: {
		title: "Se connecter",
		description:
			"Entrez votre email ci-dessous et soumettez pour vous connecter",
	},
	VerifyEmail: {
		title: "Vérification de l'email",
		description:
			"Entrez le code que nous vous avons envoyé pour vérifier votre email",
	},
	UserButton: {
		theme: {
			label: "Thème",
			light: "Clair",
			dark: "Sombre",
			system: "Système",
		},
		account: "Compte",
		switch: {
			admin: "Passer en administrateur",
			learner: "Passer en apprenant",
		},
		signout: "Se déconnecter",
	},
	Course: {
		start: "Commencer",
		continue: "Continuer",
	},
	LoginForm: {
		email: {
			label: "E-mail",
		},
	},
	VerifyEmailForm: {
		code: {
			label: "Code",
		},
	},
	UserForm: {
		title: "Compte",
		description: "Gérez les paramètres de votre compte.",
		firstName: {
			label: "Prénom",
		},
		lastName: {
			label: "Nom de famille",
		},
	},
	TeamSwitcher: {
		title: "Équipes",
		create: "Créer une équipe",
	},
	ConnectionWrapper: {
		invited: "Vous avez été invité à",
		request: "Souhaitez-vous demander l'accès à",
		requested:
			"Accès demandé, veuillez attendre qu'un administrateur approuve.",
		rejected: "Un administrateur a rejeté votre demande",
	},
	Errors: {
		title: "Quelque chose s'est mal passé !",
		tryAgain: "Essayer à nouveau",
		goBack: "Retourner",
		NotFound: {
			title: "404",
			message: "La page que vous recherchez n'existe pas.",
			home: "Accueil",
		},
	},
	NotAMember: {
		title: "Pas un administrateur",
		message:
			"Vous n'avez pas été invité à administrer cette équipe. Veuillez contacter un administrateur de l'équipe et demander une invitation pour accéder au tableau de bord d'administration de l'équipe.",
		inviteMessage:
			"Vous avez été invité à administrer cette équipe. Veuillez accepter ou refuser l'invitation ci-dessous.",
	},
};

export default fr;
