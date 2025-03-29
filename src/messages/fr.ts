import { Messages } from "@/lib/locale";

const fr: Messages = {
	Nav: {
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
	Home: {
		title: { "1": "Apprentissage moderne", "2": "Moins cher" },
		description:
			"Découvrez une gestion de l'apprentissage moderne, abordable et facile pour une expérience éducative enrichissante.",
		"get-started": "Démarrer",
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
		Completion: {
			title: "Félicitations !",
			completed: "Complété",
			congratulations: "Félicitations ! Vous avez complété",
			certificate: "Téléchargez votre certificat de réussite :",
			get: "Télécharger",
		},
		CourseInvite: {
			subject: "Invitation :",
			title: "Invitation",
			invite: "vous invite à vous joindre à :",
			start: "Commencer",
			below: "☕ Besoin de prendre une pause ? Nous avons une solution. Apprenez à votre propre rythme en cliquant sur le bouton ci-dessus pour reprendre là où vous vous êtes arrêté. \n\n Lorsque vous aurez terminé votre apprentissage, vous recevrez par courriel un certificat de réussite. \n\n Veuillez vous abstenir de répondre à ce courriel car il n'y a pas de boîte de réception prévue à cet effet. \n\n Bon apprentissage !",
		},
		CollectionInvite: {
			subject: "Invitation :",
			title: "Invitation",
			invite: "vous invite à vous joindre à :",
			start: "Commencer",
			by: "offert par",
			below: "☕ Besoin de prendre une pause ? Nous avons une solution. Apprenez à votre propre rythme en cliquant sur le bouton ci-dessus pour reprendre là où vous vous êtes arrêté. \n\n Pour chacun des cours ci-dessus que vous complétez, vous recevrez un certificat de réussite. \n\n Veuillez vous abstenir de répondre à ce courriel car il n'y a pas de boîte de réception prévue à cet effet. \n\n Bon apprentissage !",
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
		passed: "Passed",
		completed: "Completed",
		either: "Either",
	},
};

export default fr;
