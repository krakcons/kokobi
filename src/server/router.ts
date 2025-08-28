import { os } from "@orpc/server";
import { authMiddleware, localeMiddleware } from "./middleware";
import { courseRouter } from "./routers/course";

export const router = os.use(localeMiddleware).use(authMiddleware).router({
	course: courseRouter,
});
