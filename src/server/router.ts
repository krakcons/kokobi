import { collectionRouter } from "./routers/collection";
import { connectionRouter } from "./routers/connection";
import { courseRouter } from "./routers/course";
import { learnerRouter } from "./routers/learner";

export const router = {
	course: courseRouter,
	collection: collectionRouter,
	learner: learnerRouter,
	connection: connectionRouter,
};
