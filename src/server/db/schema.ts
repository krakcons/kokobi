import { type InferSelectModel, relations, sql } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	primaryKey,
	text,
} from "drizzle-orm/sqlite-core";
export * from "./auth";
import { users, sessions, organizations, apikeys } from "./auth";

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

// ORGANIZATIONS //

export const organizationTranslations = sqliteTable(
	"organization_translations",
	{
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, {
				onDelete: "cascade",
			}),
		locale: localeEnum.notNull(),
		name: text().notNull(),
		logo: text(),
		favicon: text(),
		...dates,
	},
	(t) => [primaryKey({ columns: [t.organizationId, t.locale] })],
);
export const domains = sqliteTable("domains", {
	id: text().primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organizations.id, {
			onDelete: "cascade",
		}),
	hostname: text().unique().notNull(),
	hostnameId: text("hostname_id").notNull(),
	...dates,
});

// COURSES //

export const courses = sqliteTable("courses", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organizations.id, {
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
	organizationId: text("organization_id")
		.notNull()
		.references(() => organizations.id, {
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
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, {
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
	(t) => [primaryKey({ columns: [t.userId, t.courseId, t.organizationId] })],
);

export const usersToModules = sqliteTable("users_to_modules", {
	id: text().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organizations.id, {
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
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, {
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
	(t) => [
		primaryKey({ columns: [t.userId, t.collectionId, t.organizationId] }),
	],
);

// CONNECTIONS (ORGANIZATION)

export const organizationsToCourses = sqliteTable(
	"organizations_to_courses",
	{
		fromOrganizationId: text("from_organization_id")
			.notNull()
			.references(() => organizations.id, {
				onDelete: "cascade",
			}),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, {
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
	(t) => [
		primaryKey({
			columns: [t.fromOrganizationId, t.courseId, t.organizationId],
		}),
	],
);

// Relations

// USERS

export const usersRelations = relations(users, ({ many }) => ({
	usersToCourses: many(usersToCourses),
	usersToModules: many(usersToModules),
	usersToCollections: many(usersToCollections),
}));

// ORGANIZATIONS

export const organizationRelations = relations(organizations, ({ many }) => ({
	courses: many(courses),
	translations: many(organizationTranslations),
	domains: many(domains),
}));

export const organizationTranslationsRelations = relations(
	organizationTranslations,
	({ one }) => ({
		organization: one(organizations, {
			fields: [organizationTranslations.organizationId],
			references: [organizations.id],
		}),
	}),
);

export const domainsRelations = relations(domains, ({ one }) => ({
	organization: one(organizations, {
		fields: [domains.organizationId],
		references: [organizations.id],
	}),
}));

export const apikeysRelations = relations(apikeys, ({ one }) => ({
	user: one(users, {
		fields: [apikeys.userId],
		references: [users.id],
	}),
}));

// COURSES

export const coursesRelations = relations(courses, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [courses.organizationId],
		references: [organizations.id],
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
	organization: one(organizations, {
		fields: [collections.organizationId],
		references: [organizations.id],
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

export const usersToCoursesRelations = relations(usersToCourses, ({ one }) => ({
	user: one(users, {
		fields: [usersToCourses.userId],
		references: [users.id],
	}),
	organization: one(organizations, {
		fields: [usersToCourses.organizationId],
		references: [organizations.id],
	}),
	course: one(courses, {
		fields: [usersToCourses.courseId],
		references: [courses.id],
	}),
}));

export const usersToModulesRelations = relations(usersToModules, ({ one }) => ({
	organization: one(organizations, {
		fields: [usersToModules.organizationId],
		references: [organizations.id],
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
		organization: one(organizations, {
			fields: [usersToCollections.organizationId],
			references: [organizations.id],
		}),
		collection: one(collections, {
			fields: [usersToCollections.collectionId],
			references: [collections.id],
		}),
	}),
);

// CONNECTIONS (ORGANIZATION)

export const organizationsToCoursesRelations = relations(
	organizationsToCourses,
	({ one }) => ({
		fromOrganizationId: one(organizations, {
			fields: [organizationsToCourses.fromOrganizationId],
			references: [organizations.id],
		}),
		organization: one(organizations, {
			fields: [organizationsToCourses.organizationId],
			references: [organizations.id],
		}),
		course: one(courses, {
			fields: [organizationsToCourses.courseId],
			references: [courses.id],
		}),
	}),
);

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
