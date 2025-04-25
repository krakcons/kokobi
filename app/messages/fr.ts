import { Messages } from "@/lib/locale";

const fr: Messages = {
	Nav: {
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
		title: "Certificat de réussite",
		message: "La présente atteste que vous avez suivi avec succès",
		download: "Télécharger",
		pdf: {
			title: "Certificat de réussite",
			message: "Nouse sommes fiers de remettre ce certificat à",
			congratulations: {
				"1": "Félicitations ! Vous avez terminé avec succès",
				"2": "offert par",
			},
			date: "Date d'achèvement",
		},
		dialog: {
			title: "Complété !",
			description:
				"Vous pouvez maintenant fermer cette fenêtre. Un courriel contenant votre certificat vous sera envoyé dans les plus brefs délais. Vous pouvez également le télécharger ci-dessous :",
			"dont-show": "Ne le montrez plus",
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
			invite: "vous invite à rejoindre les groupes suivants :",
			action: "Voir l'invitation",
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
};

export default fr;
