import { collectionRouter } from "./routers/collection";
import { courseRouter } from "./routers/course";

export const router = {
	course: courseRouter,
	collection: collectionRouter,
};
