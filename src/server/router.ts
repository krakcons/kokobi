import { collectionRouter } from "./routers/collection";
import { connectionRouter } from "./routers/connection";
import { courseRouter } from "./routers/course";
import { learnerRouter } from "./routers/learner";
import { organizationRouter } from "./routers/organization";

export const router = {
	course: courseRouter,
	collection: collectionRouter,
	learner: learnerRouter,
	connection: connectionRouter,
	organization: organizationRouter,
};
