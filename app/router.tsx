import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { routeTree } from "./routeTree.gen";
import { ThemeProvider } from "./lib/theme";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { NotFound } from "./components/NotFound";
import { toast } from "sonner";

export const createRouter = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			mutations: {
				onError: (err) => {
					console.error(err);
					toast.error(err.message);
				},
			},
		},
	});

	const router = routerWithQueryClient(
		createTanstackRouter({
			routeTree,
			context: { queryClient },
			defaultPreload: "intent",
			defaultErrorComponent: DefaultCatchBoundary,
			scrollRestoration: true,
			defaultNotFoundComponent: () => <NotFound />,
			Wrap: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
		}),
		queryClient,
	);
	return router;
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof createRouter;
	}
}
