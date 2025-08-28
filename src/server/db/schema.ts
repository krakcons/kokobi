import { type InferSelectModel, relations, sql } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	primaryKey,
	text,
} from "drizzle-orm/sqlite-core";

// Enums

export const moduleTypeEnum = text({ enum: ["1.2", "2004"] });
export const localeEnum = text({ enum: ["en", "fr"] });
export const roleEnum = text({ enum: ["owner", "member"] });

const dates = {
	createdAt: integer("created_at", {
		mode: "timestamp",
	})
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", {
		mode: "timestamp",
	})
		.notNull()
		.default(sql`(unixepoch())`),
};

const sharing = {
	connectType: text("connect_type", {
		enum: ["invite", "request"],
	}).notNull(),
	connectStatus: text("connect_status", {
		enum: ["pending", "accepted", "rejected"],
	}).notNull(),
};

// USERS //

export const users = sqliteTable("users", {
	id: text().primaryKey(),
	email: text().unique().notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	...dates,
});
export const sessions = sqliteTable("sessions", {
	id: text().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	expiresAt: integer("expires_at", {
		mode: "timestamp",
	}).notNull(),
});
export const emailVerifications = sqliteTable("email_verifications", {
	id: text().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	code: text().notNull(),
	expiresAt: integer("expires_at", {
		mode: "timestamp",
	})
		.$default(() => new Date(Date.now() + 1000 * 60 * 15))
		.notNull(),
});

// TEAMS //

export const teams = sqliteTable("teams", {
	id: text().primaryKey(),
	...dates,
});
export const teamTranslations = sqliteTable(
	"team_translations",
	{
		teamId: text("team_id")
			.notNull()
			.references(() => teams.id, {
				onDelete: "cascade",
			}),
		locale: localeEnum.notNull(),
		name: text().notNull(),
		logo: text(),
		favicon: text(),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.teamId, t.locale] })],
);
export const domains = sqliteTable("domains", {
	id: text().primaryKey(),
	teamId: text("team_id")
		.notNull()
		.references(() => teams.id, {
			onDelete: "cascade",
		}),
	hostname: text().unique().notNull(),
	hostnameId: text("hostname_id").notNull(),
	...dates,
});
export const keys = sqliteTable("keys", {
	id: text().primaryKey().notNull(),
	teamId: text("team_id")
		.notNull()
		.references(() => teams.id, {
			onDelete: "cascade",
		}),
	name: text().notNull(),
	key: text().notNull(),
	...dates,
});

// COURSES //

export const courses = sqliteTable("courses", {
	id: text().primaryKey().notNull(),
	teamId: text("team_id")
		.notNull()
		.references(() => teams.id, {
			onDelete: "cascade",
		}),
	completionStatus: text("completion_status", {
		enum: ["passed", "completed", "either"],
	})
		.notNull()
		.default("either"),
	...dates,
});
export const courseTranslations = sqliteTable(
	"course_translations",
	{
		courseId: text("course_id")
			.notNull()
			.references(() => courses.id, {
				onDelete: "cascade",
			}),
		locale: localeEnum.notNull(),
		name: text().notNull(),
		description: text().notNull(),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.courseId, t.locale] })],
);
export const modules = sqliteTable("modules", {
	id: text().primaryKey().notNull(),
	courseId: text("course_id")
		.notNull()
		.references(() => courses.id, {
			onDelete: "cascade",
		}),
	locale: localeEnum.notNull(),
	type: moduleTypeEnum.notNull(),
	versionNumber: integer("version_number").notNull().default(1),
	...dates,
});

// COLLECTIONS //

export const collections = sqliteTable("collections", {
	id: text().primaryKey().notNull(),
	teamId: text("team_id")
		.notNull()
		.references(() => teams.id, {
			onDelete: "cascade",
		}),
	...dates,
});
export const collectionTranslations = sqliteTable(
	"collection_translations",
	{
		collectionId: text("collection_id")
			.notNull()
			.references(() => collections.id, {
				onDelete: "cascade",
			}),
		locale: localeEnum.notNull(),
		name: text().notNull(),
		description: text().notNull(),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.collectionId, t.locale] })],
);

export const collectionsToCourses = sqliteTable(
	"collections_to_courses",
	{
		collectionId: text("collection_id")
			.notNull()
			.references(() => collections.id, {
				onDelete: "cascade",
			}),
		courseId: text("course_id")
			.notNull()
			.references(() => courses.id, {
				onDelete: "cascade",
			}),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.collectionId, t.courseId] })],
);

// CONNECTIONS //

export const usersToCourses = sqliteTable(
	"users_to_courses",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id, {
				onDelete: "cascade",
			}),
		teamId: text("team_id")
			.notNull()
			.references(() => teams.id, {
				onDelete: "cascade",
			}),
		courseId: text("course_id")
			.notNull()
			.references(() => courses.id, {
				onDelete: "cascade",
			}),
		...dates,
		...sharing,
	},
	(t) => [primaryKey({ columns: [t.userId, t.courseId, t.teamId] })],
);

export const usersToModules = sqliteTable("users_to_modules", {
	id: text().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	teamId: text("team_id")
		.notNull()
		.references(() => teams.id, {
			onDelete: "cascade",
		}),
	moduleId: text("module_id")
		.notNull()
		.references(() => modules.id, {
			onDelete: "cascade",
		}),
	courseId: text("course_id")
		.notNull()
		.references(() => courses.id, {
			onDelete: "cascade",
		}),
	completedAt: integer("completed_at", {
		mode: "timestamp",
	}).default(sql`null`),
	data: text({
		mode: "json",
	})
		.$type<Record<string, string>>()
		.notNull()
		.default({}),
	...dates,
});

export const usersToCollections = sqliteTable(
	"users_to_collections",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id, {
				onDelete: "cascade",
			}),
		teamId: text("team_id")
			.notNull()
			.references(() => teams.id, {
				onDelete: "cascade",
			}),
		collectionId: text("collection_id")
			.notNull()
			.references(() => collections.id, {
				onDelete: "cascade",
			}),
		...dates,
		...sharing,
	},
	(t) => [primaryKey({ columns: [t.userId, t.collectionId, t.teamId] })],
);

export const usersToTeams = sqliteTable(
	"users_to_teams",
	{
		userId: text("user_id").notNull(),
		teamId: text("team_id")
			.notNull()
			.references(() => teams.id, {
				onDelete: "cascade",
			}),
		role: roleEnum.notNull().default(sql`'member'`),
		...dates,
		...sharing,
	},
	(t) => [primaryKey({ columns: [t.userId, t.teamId] })],
);

// CONNECTIONS (TEAM)

export const teamsToCourses = sqliteTable(
	"teams_to_courses",
	{
		fromTeamId: text("from_team_id")
			.notNull()
			.references(() => teams.id, {
				onDelete: "cascade",
			}),
		teamId: text("team_id")
			.notNull()
			.references(() => teams.id, {
				onDelete: "cascade",
			}),
		courseId: text("course_id")
			.notNull()
			.references(() => courses.id, {
				onDelete: "cascade",
			}),
		...dates,
		...sharing,
	},
	(t) => [primaryKey({ columns: [t.fromTeamId, t.courseId, t.teamId] })],
);

// Relations

// USERS

export const usersRelations = relations(users, ({ many }) => ({
	usersToTeams: many(usersToTeams),
	usersToCourses: many(usersToCourses),
	usersToModules: many(usersToModules),
	usersToCollections: many(usersToCollections),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
	userId: one(users, {
		fields: [sessions.userId],
		references: [users.id],
		relationName: "userId",
	}),
}));

export const emailVerificationsRelations = relations(
	emailVerifications,
	({ one }) => ({
		user: one(users, {
			fields: [emailVerifications.userId],
			references: [users.id],
		}),
	}),
);

// TEAMS

export const teamRelations = relations(teams, ({ many }) => ({
	usersToTeams: many(usersToTeams),
	courses: many(courses),
	keys: many(keys),
	translations: many(teamTranslations),
	domains: many(domains),
}));

export const teamTranslationsRelations = relations(
	teamTranslations,
	({ one }) => ({
		team: one(teams, {
			fields: [teamTranslations.teamId],
			references: [teams.id],
		}),
	}),
);

export const domainsRelations = relations(domains, ({ one }) => ({
	team: one(teams, {
		fields: [domains.teamId],
		references: [teams.id],
	}),
}));

export const keysRelations = relations(keys, ({ one }) => ({
	team: one(teams, {
		fields: [keys.teamId],
		references: [teams.id],
	}),
}));

// COURSES

export const coursesRelations = relations(courses, ({ one, many }) => ({
	team: one(teams, {
		fields: [courses.teamId],
		references: [teams.id],
	}),
	collectionsToCourses: many(collectionsToCourses),
	modules: many(modules),
	translations: many(courseTranslations),
}));

export const courseTranslationsRelations = relations(
	courseTranslations,
	({ one }) => ({
		course: one(courses, {
			fields: [courseTranslations.courseId],
			references: [courses.id],
		}),
	}),
);

export const modulesRelations = relations(modules, ({ many, one }) => ({
	course: one(courses, {
		fields: [modules.courseId],
		references: [courses.id],
	}),
	usersToModules: many(usersToModules),
}));

// COLLECTIONS

export const collectionsRelations = relations(collections, ({ one, many }) => ({
	team: one(teams, {
		fields: [collections.teamId],
		references: [teams.id],
	}),
	collectionsToCourses: many(collectionsToCourses),
	translations: many(collectionTranslations),
}));

export const collectionsToCoursesRelations = relations(
	collectionsToCourses,
	({ one }) => ({
		collection: one(collections, {
			fields: [collectionsToCourses.collectionId],
			references: [collections.id],
		}),
		course: one(courses, {
			fields: [collectionsToCourses.courseId],
			references: [courses.id],
		}),
	}),
);

export const collectionTranslationsRelations = relations(
	collectionTranslations,
	({ one }) => ({
		collection: one(collections, {
			fields: [collectionTranslations.collectionId],
			references: [collections.id],
		}),
	}),
);

// CONNECTIONS (USER)

export const usersToTeamsRelations = relations(usersToTeams, ({ one }) => ({
	user: one(users, {
		fields: [usersToTeams.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [usersToTeams.teamId],
		references: [teams.id],
	}),
}));

export const usersToCoursesRelations = relations(usersToCourses, ({ one }) => ({
	user: one(users, {
		fields: [usersToCourses.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [usersToCourses.teamId],
		references: [teams.id],
	}),
	course: one(courses, {
		fields: [usersToCourses.courseId],
		references: [courses.id],
	}),
}));

export const usersToModulesRelations = relations(usersToModules, ({ one }) => ({
	team: one(teams, {
		fields: [usersToModules.teamId],
		references: [teams.id],
	}),
	user: one(users, {
		fields: [usersToModules.userId],
		references: [users.id],
	}),
	course: one(courses, {
		fields: [usersToModules.courseId],
		references: [courses.id],
	}),
	module: one(modules, {
		fields: [usersToModules.moduleId],
		references: [modules.id],
	}),
}));

export const usersToCollectionsRelations = relations(
	usersToCollections,
	({ one }) => ({
		user: one(users, {
			fields: [usersToCollections.userId],
			references: [users.id],
		}),
		team: one(teams, {
			fields: [usersToCollections.teamId],
			references: [teams.id],
		}),
		collection: one(collections, {
			fields: [usersToCollections.collectionId],
			references: [collections.id],
		}),
	}),
);

// CONNECTIONS (TEAM)

export const teamsToCoursesRelations = relations(teamsToCourses, ({ one }) => ({
	fromTeamId: one(teams, {
		fields: [teamsToCourses.fromTeamId],
		references: [teams.id],
	}),
	team: one(teams, {
		fields: [teamsToCourses.teamId],
		references: [teams.id],
	}),
	course: one(courses, {
		fields: [teamsToCourses.courseId],
		references: [courses.id],
	}),
}));

export const tableSchemas = {
	// USERS
	users,
	sessions,
	emailVerifications,
	// TEAMS
	teams,
	teamTranslations,
	domains,
	keys,
	// COURSES
	courses,
	courseTranslations,
	modules,
	// COLLECTIONS
	collections,
	collectionTranslations,
	collectionsToCourses,
	// CONNECTIONS (USER)
	usersToModules,
	usersToCollections,
	usersToCourses,
	usersToTeams,
	// CONNECTIONS (TEAM)
	teamsToCourses,
};

export const relationSchemas = {
	// USERS
	usersRelations,
	sessionRelations,
	emailVerificationsRelations,
	// TEAMS
	teamRelations,
	teamTranslationsRelations,
	domainsRelations,
	keysRelations,
	// COURSES
	coursesRelations,
	courseTranslationsRelations,
	modulesRelations,
	// COLLECTIONS
	collectionsRelations,
	collectionTranslationsRelations,
	collectionsToCoursesRelations,
	// CONNECTIONS
	usersToTeamsRelations,
	usersToCoursesRelations,
	usersToModulesRelations,
	usersToCollectionsRelations,
	// CONNECTIONS (TEAM)
	teamsToCoursesRelations,
};

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
