import { InferSelectModel, relations, sql } from "drizzle-orm";
import {
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

// Enums

export const moduleTypeEnum = text("module_type", { enum: ["1.2", "2004"] });
export const localeEnum = text("locale", { enum: ["en", "fr"] });
export const roleEnum = text("role", { enum: ["owner", "member"] });

const dates = {
	createdAt: timestamp("created_at", {
		withTimezone: true,
	})
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamp("updated_at", {
		withTimezone: true,
	})
		.notNull()
		.default(sql`now()`),
};

const sharing = {
	connectType: text("type", { enum: ["shared", "requested"] }).notNull(),
	connectStatus: text("status", {
		enum: ["pending", "accepted", "rejected"],
	}).notNull(),
};

// USERS //

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	email: text("email").unique().notNull(),
	googleId: text("googleId").unique("googleId", { nulls: "not distinct" }),
	firstName: text("firstName"),
	lastName: text("lastName"),
	...dates,
});
export const sessions = pgTable("sessions", {
	id: text("id").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	expiresAt: timestamp("expiresAt", {
		withTimezone: true,
		mode: "date",
	}).notNull(),
});

// TEAMS //

export const teams = pgTable("teams", {
	id: text("id").primaryKey(),
	...dates,
});
export const teamTranslations = pgTable(
	"team_translations",
	{
		teamId: text("teamId")
			.notNull()
			.references(() => teams.id, {
				onDelete: "cascade",
			}),
		locale: localeEnum.notNull(),
		name: text("name").notNull(),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.teamId, t.locale] })],
);
export const domains = pgTable("domains", {
	id: text("id").primaryKey(),
	teamId: text("teamId")
		.notNull()
		.references(() => teams.id, {
			onDelete: "cascade",
		}),
	hostname: text("hostname").unique().notNull(),
	hostnameId: text("hostnameId").notNull(),
	...dates,
});
export const keys = pgTable("keys", {
	id: text("id").primaryKey().notNull(),
	teamId: text("teamId")
		.notNull()
		.references(() => teams.id, {
			onDelete: "cascade",
		}),
	name: text("name").notNull(),
	key: text("key").notNull(),
	...dates,
});

// COURSES //

export const courses = pgTable("courses", {
	id: text("id").primaryKey().notNull(),
	teamId: text("teamId")
		.notNull()
		.references(() => teams.id, {
			onDelete: "cascade",
		}),
	completionStatus: text("completionStatus", {
		enum: ["passed", "completed", "either"],
	})
		.notNull()
		.default("passed"),
	...dates,
});
export const courseTranslations = pgTable(
	"course_translations",
	{
		courseId: text("courseId")
			.notNull()
			.references(() => courses.id, {
				onDelete: "cascade",
			}),
		locale: localeEnum.notNull(),
		name: text("name").notNull(),
		description: text("description").notNull(),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.courseId, t.locale] })],
);
export const modules = pgTable("modules", {
	id: text("id").primaryKey().notNull(),
	courseId: text("courseId")
		.notNull()
		.references(() => courses.id, {
			onDelete: "cascade",
		}),
	locale: localeEnum.notNull(),
	type: moduleTypeEnum.notNull(),
	versionNumber: integer("versionNumber").notNull().default(1),
	...dates,
});

// COLLECTIONS //

export const collections = pgTable("collections", {
	id: text("id").primaryKey().notNull(),
	teamId: text("teamId")
		.notNull()
		.references(() => teams.id, {
			onDelete: "cascade",
		}),
	...dates,
});
export const collectionTranslations = pgTable(
	"collection_translations",
	{
		collectionId: text("collectionId")
			.notNull()
			.references(() => collections.id, {
				onDelete: "cascade",
			}),
		locale: localeEnum.notNull(),
		name: text("name").notNull(),
		description: text("description").notNull(),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.collectionId, t.locale] })],
);

export const collectionsToCourses = pgTable(
	"collections_to_courses",
	{
		collectionId: text("collectionId")
			.notNull()
			.references(() => collections.id, {
				onDelete: "cascade",
			}),
		courseId: text("courseId")
			.notNull()
			.references(() => courses.id, {
				onDelete: "cascade",
			}),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.collectionId, t.courseId] })],
);

// CONNECTIONS //

export const usersToCourses = pgTable(
	"users_to_courses",
	{
		userId: text("userId")
			.notNull()
			.references(() => users.id, {
				onDelete: "cascade",
			}),
		teamId: text("teamId")
			.notNull()
			.references(() => teams.id, {
				onDelete: "cascade",
			}),
		courseId: text("courseId")
			.notNull()
			.references(() => courses.id, {
				onDelete: "cascade",
			}),
		...dates,
		...sharing,
	},
	(t) => [primaryKey({ columns: [t.userId, t.courseId, t.teamId] })],
);

export const usersToModules = pgTable("users_to_modules", {
	id: text("id").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	moduleId: text("moduleId")
		.notNull()
		.references(() => modules.id, {
			onDelete: "cascade",
		}),
	courseId: text("courseId")
		.notNull()
		.references(() => courses.id, {
			onDelete: "cascade",
		}),
	completedAt: timestamp("completedAt", {
		withTimezone: true,
	})
		.default(sql`null`)
		.$type<Date | null>(),
	startedAt: timestamp("startedAt", {
		withTimezone: true,
	})
		.default(sql`null`)
		.$type<Date | null>(),
	data: jsonb("data").$type<Record<string, string>>().notNull().default({}),
	...dates,
});

export const usersToCollections = pgTable(
	"users_to_collections",
	{
		userId: text("userId")
			.notNull()
			.references(() => users.id, {
				onDelete: "cascade",
			}),
		teamId: text("teamId")
			.notNull()
			.references(() => teams.id, {
				onDelete: "cascade",
			}),
		collectionId: text("collectionId")
			.notNull()
			.references(() => collections.id, {
				onDelete: "cascade",
			}),
	},
	(t) => [primaryKey({ columns: [t.userId, t.collectionId] })],
);

export const usersToTeams = pgTable(
	"users_to_teams",
	{
		userId: text("userId").notNull(),
		teamId: text("teamId")
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

// CONNECTIONS

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
		collection: one(collections, {
			fields: [usersToCollections.collectionId],
			references: [collections.id],
		}),
	}),
);

export const tableSchemas = {
	// USERS
	users,
	sessions,
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
	// CONNECTIONS
	usersToModules,
	usersToCollections,
	usersToCourses,
	usersToTeams,
};

export const relationSchemas = {
	// USERS
	usersRelations,
	sessionRelations,
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
};

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
