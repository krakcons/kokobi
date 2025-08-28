import { db } from "@/server/db";
import { courses } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale";
import { publicProcedure } from "../middleware";
import { z } from "zod";
import { ORPCError } from "@orpc/client";
import { CourseSchema } from "@/types/course";
import { TeamSchema } from "@/types/team";

export const courseRouter = {
	getId: publicProcedure
		.route({ method: "GET", path: "/courses/{id}" })
		.input(
			z.object({
				id: z.string().min(1),
			}),
		)
		.output(CourseSchema.extend({ team: TeamSchema }))
		.handler(async ({ context, input: { id } }) => {
			console.log("ID", id);
			const course = await db.query.courses.findFirst({
				where: and(eq(courses.id, id)),
				with: {
					translations: true,
					team: {
						with: {
							translations: true,
						},
					},
				},
			});

			console.log("COURSE", course);

			if (!course) {
				throw new ORPCError("NOT_FOUND");
			}

			return {
				...handleLocalization(context, course),
				team: handleLocalization(context, course.team),
			};
		}),
};
