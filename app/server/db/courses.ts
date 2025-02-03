import { CreateCourse, SelectCourse } from "@/types/course";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { cache } from "react";
import { deleteFolder } from "../r2";
import { svix } from "../svix";
import { db } from "./db";
import {
	collectionsToCourses,
	courseTranslations,
	courses,
	learners,
	modules,
} from "./schema";

export const coursesData = {
	create: async (course: CreateCourse, teamId: string) => {
		const c = await db
			.insert(courses)
			.values({ ...course, teamId })
			.returning();
		await db.insert(courseTranslations).values({
			courseId: c[0].id,
			...course,
		});
		return c[0];
	},
	get: cache(async ({ id }: SelectCourse, teamId: string) => {
		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
		});

		if (!course) {
			throw new HTTPException(404, {
				message: "Course not found.",
			});
		}

		return course;
	}),
	delete: async ({ id }: SelectCourse, teamId: string) => {
		const course = await coursesData.get({ id }, teamId);

		console.log("Deleting course", course.id);
		// Delete course
		await db
			.delete(courses)
			.where(and(eq(courses.id, course.id), eq(courses.teamId, teamId)));

		// Delete all modules and learners
		console.log("Deleting modules", course.id);
		const modulesList = await db.query.modules.findMany({
			where: eq(modules.courseId, course.id),
		});
		modulesList.forEach(async (module) => {
			await db.delete(learners).where(eq(learners.moduleId, module.id));
		});
		await db.delete(modules).where(eq(modules.courseId, course.id));

		// Delete from collections
		console.log("Deleting from collections", course.id);
		await db
			.delete(collectionsToCourses)
			.where(eq(collectionsToCourses.courseId, course.id));

		try {
			await svix.application.delete(`app_${course.id}`);
		} catch (e) {
			console.error(e);
		}

		await deleteFolder(`${teamId}/courses/${course.id}`);
	},
	getAll: cache(async (_: undefined, teamId: string) => {
		return await db.query.courses.findMany({
			where: eq(courses.teamId, teamId),
		});
	}),
	getCourseWithModules: async ({ id }: SelectCourse, teamId: string) => {
		return await db.query.courses.findFirst({
			where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			with: {
				modules: {
					with: {
						learners: true,
					},
				},
			},
		});
	},
};
