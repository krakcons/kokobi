import { InferSelectModel, relations, sql } from "drizzle-orm";
import {
	integer,
	json,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums

export const moduleTypeEnum = pgEnum("module_type", ["1.2", "2004"]);
export const languageEnum = pgEnum("language_enum", ["en", "fr"]);
export const roleEnum = pgEnum("role_enum", ["owner", "member"]);

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

// Tables

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	email: text("email").unique().notNull(),
	googleId: text("googleId").unique(),
	...dates,
});

export const teams = pgTable("teams", {
	id: text("id").primaryKey(),
	...dates,
});

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

export const usersToTeams = pgTable(
	"users_to_teams",
	{
		userId: text("userId").notNull(),
		teamId: text("teamId")
			.notNull()
			.references(() => teams.id, {
				onDelete: "cascade",
			}),
		role: roleEnum("role")
			.notNull()
			.default(sql`'member'`),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.userId, t.teamId] })],
);

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

export const collections = pgTable("collections", {
	id: text("id").primaryKey().notNull(),
	teamId: text("teamId")
		.notNull()
		.references(() => teams.id, {
			onDelete: "cascade",
		}),
	...dates,
});

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

export const modules = pgTable("modules", {
	id: text("id").primaryKey().notNull(),
	courseId: text("courseId")
		.notNull()
		.references(() => courses.id, {
			onDelete: "cascade",
		}),
	language: languageEnum("language").notNull(),
	type: moduleTypeEnum("type").notNull(),
	versionNumber: integer("versionNumber").notNull().default(1),
	...dates,
});

export const learners = pgTable(
	"learners",
	{
		id: text("id").primaryKey().notNull(),
		teamId: text("teamId").notNull(),
		collectionId: text("collectionId"),
		courseId: text("courseId").notNull(),
		moduleId: text("moduleId").references(() => modules.id, {
			onDelete: "cascade",
		}),
		email: text("email").notNull(),
		firstName: text("firstName").notNull(),
		lastName: text("lastName").notNull(),
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
		data: json("data")
			.$type<Record<string, string>>()
			.notNull()
			.default({}),
		...dates,
	},
	(t) => [uniqueIndex("unq_learner").on(t.courseId, t.email)],
);

export const courseTranslations = pgTable(
	"course_translations",
	{
		courseId: text("courseId")
			.notNull()
			.references(() => courses.id, {
				onDelete: "cascade",
			}),
		language: languageEnum("language").notNull(),
		name: text("name").notNull(),
		description: text("description").notNull(),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.courseId, t.language] })],
);

export const teamTranslations = pgTable(
	"team_translations",
	{
		teamId: text("teamId")
			.notNull()
			.references(() => teams.id, {
				onDelete: "cascade",
			}),
		language: languageEnum("language").notNull(),
		name: text("name").notNull(),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.teamId, t.language] })],
);

export const collectionTranslations = pgTable(
	"collection_translations",
	{
		collectionId: text("collectionId")
			.notNull()
			.references(() => collections.id, {
				onDelete: "cascade",
			}),
		language: languageEnum("language").notNull(),
		name: text("name").notNull(),
		description: text("description").notNull(),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.collectionId, t.language] })],
);

// Relations

export const usersRelations = relations(users, ({ many }) => ({
	usersToTeams: many(usersToTeams),
}));

export const teamRelations = relations(teams, ({ many }) => ({
	usersToTeams: many(usersToTeams),
	courses: many(courses),
	keys: many(keys),
	translations: many(teamTranslations),
	learners: many(learners),
	domains: many(domains),
}));

export const domainsRelations = relations(domains, ({ one }) => ({
	team: one(teams, {
		fields: [domains.teamId],
		references: [teams.id],
	}),
}));

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

export const sessionRelations = relations(sessions, ({ one }) => ({
	userId: one(users, {
		fields: [sessions.userId],
		references: [users.id],
		relationName: "userId",
	}),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
	team: one(teams, {
		fields: [collections.teamId],
		references: [teams.id],
	}),
	collectionsToCourses: many(collectionsToCourses),
	translations: many(collectionTranslations),
	learners: many(learners),
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

export const modulesRelations = relations(modules, ({ many, one }) => ({
	course: one(courses, {
		fields: [modules.courseId],
		references: [courses.id],
	}),
	learners: many(learners),
}));

export const keysRelations = relations(keys, ({ one }) => ({
	team: one(teams, {
		fields: [keys.teamId],
		references: [teams.id],
	}),
}));

export const collectionTranslationsRelations = relations(
	collectionTranslations,
	({ one }) => ({
		collection: one(collections, {
			fields: [collectionTranslations.collectionId],
			references: [collections.id],
		}),
	}),
);

export const coursesRelations = relations(courses, ({ one, many }) => ({
	team: one(teams, {
		fields: [courses.teamId],
		references: [teams.id],
	}),
	collectionsToCourses: many(collectionsToCourses),
	modules: many(modules),
	translations: many(courseTranslations),
}));

export const learnersRelations = relations(learners, ({ one }) => ({
	module: one(modules, {
		fields: [learners.moduleId],
		references: [modules.id],
	}),
	course: one(courses, {
		fields: [learners.courseId],
		references: [courses.id],
	}),
	team: one(teams, {
		fields: [learners.teamId],
		references: [teams.id],
	}),
	collection: one(collections, {
		fields: [learners.collectionId],
		references: [collections.id],
	}),
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

export const courseTranslationsRelations = relations(
	courseTranslations,
	({ one }) => ({
		course: one(courses, {
			fields: [courseTranslations.courseId],
			references: [courses.id],
		}),
	}),
);

export const tableSchemas = {
	users,
	sessions,
	teams,
	domains,
	usersToTeams,
	keys,
	collections,
	collectionsToCourses,
	courses,
	modules,
	learners,
	courseTranslations,
	collectionTranslations,
	teamTranslations,
};

export const relationSchemas = {
	usersRelations,
	sessionRelations,
	teamRelations,
	domainsRelations,
	coursesRelations,
	learnersRelations,
	usersToTeamsRelations,
	collectionTranslationsRelations,
	courseTranslationsRelations,
	teamTranslationsRelations,
	collectionsRelations,
	collectionsToCoursesRelations,
	modulesRelations,
};

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
