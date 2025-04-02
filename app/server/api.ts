import { queryOptions } from "@tanstack/react-query";
import { ServerFn } from "@tanstack/react-start";

export const createQueryOptions = (serverFn: any) => {
	return queryOptions({
		queryKey: [serverFn.url],
		queryFn: () => serverFn(),
	});
};
