import type { Messages } from "@/lib/locale";

const fr: Messages = {
	Actions: {
		title: "Actes",
		delete: "Supprimer",
		create: "Créer",
		cancel: "Annuler",
		continue: "Continuer",
	},
	AdminSidebar: {
		switchToLearner: "Passer en Apprenant",
		editing: "Edition",
		manage: "Gérer",
		dashboard: "Tableau de bord",
		organization: "Organisation",
		edit: "Modifier l'organisation",
		apiKeys: "Clés API",
		certificate: "Certificat",
		domains: "Domaines",
		members: "Membres",
		courses: "Cours",
		createCourse: "Créer un cours",
		collections: "Collections",
		createCollection: "Créer une collection",
		settings: "Paramètres",
		learners: "Apprenants",
		statistics: "Statistiques",
		sharing: "Partage",
	},
	AdminDashboard: {
		title: "Tableau de bord",
		description:
			"Bienvenue dans le tableau de bord. Ce portail d'administration vous permettra de créer et de gérer des cours, d'inviter des apprenants et bien plus encore.",
		course: {
			title: "Créez votre premier cours",
			description:
				"Les cours vous permettent de partager du matériel d'apprentissage selon les normes Scorm 1.2 et 2004",
		},
		collection: {
			title: "Créez votre première collection",
			description:
				"Les collections sont un moyen d'organiser une liste de cours.",
		},
	},
	AuthLoginForm: {
		email: "E-mail",
		rememberMe: "Se souvenir de moi",
	},
	AuthLogin: {
		title: "Se connecter",
		description:
			"Entrez votre email ci-dessous et soumettez pour vous connecter",
	},
	AuthVerifyEmail: {
		title: "Vérification de l'email",
		description:
			"Entrez le code que nous vous avons envoyé pour vérifier votre email",
	},
	AuthVerifyEmailForm: {
		code: {
			label: "Code",
		},
	},
	APIKeys: {
		title: "Clés API",
		description:
			"Les clés API vous permettent d'accéder à votre instance Kokobi à partir d'applications externes à l'aide d'une API REST.",
		table: {
			name: "Nom",
			key: "Clé",
			createdAt: "Créé à",
			createdBy: "Créé par",
			lastRequest: "Dernière requête",
		},
	},
	APIKeyForm: {
		title: "Créer une clé API",
		description: "Entrez le nom de la clé ci-dessous.",
		name: "Nom",
	},
	CourseSettings: {
		title: "Paramètres",
		description: "Modifier les paramètres de votre cours",
		delete: {
			title: "Supprimer un cours",
			description:
				"Cela supprimera le cours et toutes les données associées. Cette action est irréversible.",
			confirm: {
				title: "Êtes-vous absolument sûr ?",
				description:
					"Cette action est irréversible. Votre cours sera définitivement supprimé et toutes les données associées (modules, apprenants, etc.) seront supprimées de nos serveurs.",
			},
		},
	},
	Certificate: {
		fileName: "certificat.pdf",
		title: "Certificat de réussite",
		description:
			"Voir un aperçu de la façon dont votre certificat sera imprimé.",
		message: "La présente atteste que vous avez suivi avec succès",
		download: "Télécharger le certificat",
		"no-name": "Le certificat nécessite un nom",
		pdf: {
			title: "Certificat de réussite",
			message: "Nous sommes fiers de remettre ce certificat à",
			congratulations: "Félicitations ! Vous avez terminé avec succès",
			date: "Date d'achèvement",
			offered: "Offert par",
			created: "Créé par",
		},
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
	ConnectionWrapper: {
		invited: "Vous avez été invité à",
		request: "Souhaitez-vous demander l'accès à",
		requested:
			"Accès demandé, veuillez attendre qu'un administrateur approuve.",
		adminRejected: "Un administrateur a rejeté votre demande",
		rejected: "Vous avez rejeté l'invitation",
	},
	Course: {
		start: "Commencer",
		continue: "Continuer",
		review: "Revoir",
		view: "Voir le Cours",
	},
	CourseForm: {
		name: "Nom",
		description: "Description",
		completionStatus: {
			label: "État d'achèvement",
			description:
				"Une fois le cours terminé, le certificat est délivré et le cours est verrouillé.",
		},
		create: {
			title: "Créer un cours",
			description: "Saisissez les détails de votre cours ci-dessous.",
		},
	},
	CoursesForm: {
		title: "Ajouter des cours",
		description:
			"Sélectionnez tous les cours que vous souhaitez ci-dessous.",
		empty: "Aucun cours disponible. Créez d'abord un cours ici.",
		create: "Créer un cours",
	},
	Collection: {
		view: "Voir la collection",
	},
	CollectionForm: {
		name: "Nom",
		description: "Description",
		updated: "Collection mise à jour avec succès.",
		create: {
			title: "Créer une collection",
			description:
				"Saisissez les détails de votre collection ci-dessous.",
		},
	},
	CollectionCourses: {
		title: "Cours",
		description: "Gérer les cours pour cette collection.",
		table: {
			name: "Nom",
			description: "Description",
		},
	},
	CollectionSettings: {
		title: "Paramètres",
		description: "Modifier les paramètres de votre collection",
		delete: {
			title: "Supprimer la collection",
			description:
				"Cela supprimera la collection et toutes les données associées. Cette action est irréversible.",
			confirm: {
				title: "Êtes-vous absolument sûr ?",
				description:
					"Cette action est irréversible. Elle supprimera définitivement votre collection et toutes les données associées (cours, apprenants, etc.) de nos serveurs.",
			},
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
	Errors: {
		title: "Quelque chose s'est mal passé !",
		tryAgain: "Essayer à nouveau",
		goBack: "Retourner",
		NotFound: {
			title: "404",
			message: "La page que vous recherchez n'existe pas.",
			home: "Accueil",
		},
	},
	Form: {
		optional: "En option",
		submit: "Soumettre",
		suggestedImageSize: "Taille de l'image suggérée :",
		otherSettings: "Autres paramètres",
		blockNavigation: {
			title: "Quitter sans sauvegarder?",
			description:
				"Vos modifications n'ont pas été sauvegardés. Si vous quittez, vous perdrez vos modifications.",
			confirm: "Confirmer",
			cancel: "Annuler",
		},
		accepts: "Accepte :",
	},
	Home: {
		title: { "1": "Apprentissage moderne", "2": "Moins cher" },
		description:
			"Découvrez une gestion de l'apprentissage moderne, abordable et facile pour une expérience éducative enrichissante.",
		"organization-description":
			"Visitez le portail d'apprentissage ou d'administration pour commencer.",
		"go-to-admin": "Aller à l'administration",
		"go-to-learning": "Aller à l'apprentissage",
	},
	Join: {
		"0": { title: "S'inscrire" },
		"1": { title: "Vos informations" },
		continue: "Continuer",
		join: "S'inscrire",
		back: "Retour",
		language: "Langue",
		"language-description":
			"Une fois inscrit, vous ne pourrez pas changer de langue et vous devrez vous réinscrire (ou demander une nouvelle invitation) pour le faire.",
	},
	Learners: {
		title: "Apprenants",
		description: "Gérez vos apprenants",
	},
	LearnerSidebar: {
		switchToAdmin: "Passer en Administrateur",
		dashboard: "Tableau de bord",
		"available-courses": "Cours disponibles",
		courses: "Cours",
		collections: "Collections",
	},
	LearnerDashboard: {
		title: "Tableau de bord",
		description:
			"Consultez tous vos cours, collections, tentatives et certificats",
		course: {
			title: "Aucun cours disponible",
			description:
				"Vous n'avez encore rejoint aucun cours. Pour rejoindre un cours, demandez l'accès à une organisation ou demandez-lui de vous inviter.",
		},
		collection: {
			title: "Aucune collection disponible",
			description:
				"Vous n'avez encore rejoint aucune collection. Pour rejoindre une collection, demandez l'accès à une organisation ou demandez-lui de vous inviter.",
		},
	},
	Learner: {
		statuses: {
			completed: "Terminé",
			"not-started": "Non démarré",
			"in-progress": "En cours",
			passed: "Réussi",
			failed: "Échec",
		},
		connectStatus: "État de la connexion",
		status: "Statut",
		score: "Score",
		startedAt: "Commencé à",
		completedAt: "Terminé à",
		resend: "Renvoyer l'invitation",
		recertify: "Renvoyer l'achèvement",
		connectedAt: "Invité/Demandé à",
		moduleLocale: "Lieu",
		moduleVersion: "Version",
	},
	LearnersForm: {
		title: "Inviter des apprenants",
		description:
			"Saisissez vos adresses e-mail ci-dessous et soumettez-les pour inviter de nouveaux apprenants.",
		add: "Ajouter un e-mail",
	},
	Locales: {
		en: "Anglais",
		fr: "Français",
	},
	Members: {
		title: "Membres",
		description: "Gérez les membres et les niveaux d'accès",
		create: "Créer un membre",
		edit: "Éditer",
		remove: "Supprimer",
		type: {
			member: "Actif",
			invite: "Invité",
		},
		status: {
			canceled: "Annulé",
			accepted: "Accepté",
			pending: "En attente",
			rejected: "Rejeté",
		},
		table: {
			name: "Nom",
			email: "Email",
			status: "Statut",
			role: "Rôle",
			access: "Accès",
		},
	},
	MemberForm: {
		title: "Membre",
		description: "Gérez les paramètres du membre.",
		email: "E-mail",
		role: "Rôle(s)",
	},
	MemberEdit: {
		title: "Éditer le membre",
		description: "Gérez les paramètres du membre.",
		toast: "Rôle du membre mis à jour",
	},
	MemberCreate: {
		title: "Inviter un membre",
		description: "Invitez un nouveau membre à votre organisation.",
	},
	Modules: {
		title: "Modules",
		description:
			"Gérer les modules de ce cours. Les modules correspondent au contenu réel du cours selon les normes Scorm 1.2 et 2004.",
		table: {
			version: "Version",
			locale: "Lieu",
			type: "Taper",
		},
	},
	ModuleForm: {
		title: "Créer un module",
		description: "Téléchargez un module Scorm ci-dessous.",
		file: "Déposer",
	},
	NotAMember: {
		title: "Pas un administrateur",
		message:
			"Vous n'avez pas été invité à administrer cette organisation. Veuillez contacter un administrateur de l'organisation et demander une invitation pour accéder au tableau de bord d'administration de l'organisation.",
		inviteMessage:
			"Vous avez été invité à administrer cette organisation. Veuillez accepter ou refuser l'invitation ci-dessous.",
	},
	Public: {
		createdBy: "Créé par",
		courses: "Cours",
	},
	SEO: {
		title: "Kokobi | Apprendre, Enseigner, Se Connecter et Grandir",
	},
	Statistics: {
		title: "Statistiques",
		description: "Consultez les statistiques de vos cours",
		filter: {
			title: "Filtrer par organisation",
			all: "Toutes les organisations",
		},
		totalAttempts: {
			title: "Nombre total de tentatives",
			description: "Nombre total d'apprenants ayant commencé ce cours.",
		},
		totalCompletions: {
			title: "Total réalisé",
			description: "Nombre total d'apprenants ayant terminé ce cours.",
		},
		averageCompletionTime: {
			title: "Délai de réalisation moyen",
			description: "Temps moyen nécessaire pour terminer ce cours.",
			minutes: "minutes",
		},
		attemptStatus: {
			title: "État de la tentative",
			description: "Nombre total d'apprenants avec chaque statut",
		},
	},
	Sharing: {
		title: "Partage",
		description: "Gérer qui peut dispenser ce cours",
		table: {
			name: "Nom",
			status: "Statut",
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
	OrganizationSettings: {
		title: "Paramètres",
		description: "Modifier les paramètres de votre organisation",
		domain: {
			rootWarning:
				"Les noms des enregistrements sont relatifs à votre domaine racine (par exemple, « email » correspond à « email.domain.com »)",
			status: "Status",
			type: "Taper",
			name: "Nom",
			value: "Valeur",
			priority: "Priorité:",
			delete: {
				confirm: {
					title: "Êtes-vous absolument sûr?",
					description:
						"Cette action ne peut être annulée. Cela supprimera définitivement votre domaine et rompra tout lien précédemment envoyé avec ce domaine (ex. invitations, lien de partage, complétion, etc.).",
				},
			},
		},
		delete: {
			title: "Supprimer l'organisation",
			description:
				"Cela supprimera l'organisation et toutes les données associées. Cette action est irréversible.",
			confirm: {
				title: "Êtes-vous absolument sûr ?",
				description:
					"Cette action est irréversible. Elle supprimera définitivement votre organisation et toutes vos données (collections, cours, apprenants, etc.) de nos serveurs.",
			},
		},
	},
	OrganizationSwitcher: {
		title: "Organisations",
		create: "Créer une organisation",
	},
	OrganizationsForm: {
		title: "Inviter des organisations",
		description:
			"Saisissez les identifiants des organisations que vous souhaitez inviter.",
		add: "Ajouter une organisation",
	},
	OrganizationDomainForm: {
		title: "Domaine personnalisé",
		description:
			"Définissez un domaine personnalisé pour diffuser le contenu de votre organisation",
		domain: "Domaine",
	},
	OrganizationForm: {
		name: "Nom",
		logo: "Logo",
		favicon: "Icône de favori",
		create: {
			title: "Créer une organisation",
			description:
				"Saisissez les détails de votre organisation ci-dessous.",
		},
	},
	Role: {
		owner: "Propriétaire",
		admin: "Administrateur",
		member: "Membre",
	},
	User: {
		email: "E-mail",
		name: "Nom",
	},
	UserForm: {
		title: "Compte",
		description: "Gérez les paramètres de votre compte.",
		name: "Nom",
		image: "L'image",
	},
	UserButton: {
		theme: {
			label: "Thème",
			light: "Clair",
			dark: "Sombre",
			system: "Système",
		},
		home: "Accueil",
		account: "Compte",
		signout: "Se déconnecter",
		signin: "Se connecter",
	},
};

export default fr;
