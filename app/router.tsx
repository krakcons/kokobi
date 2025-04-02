import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { routeTree } from "./routeTree.gen";
import { ThemeProvider } from "./lib/theme";
import { NotFound } from "./components/NotFound";

const queryClient = new QueryClient();

export const createRouter = () => {
	const router = createTanstackRouter({
		routeTree,
		context: { queryClient },
		defaultPreload: "intent",
		defaultErrorComponent: DefaultCatchBoundary,
		scrollRestoration: true,
		defaultNotFoundComponent: () => <NotFound />,
		Wrap: ({ children }) => {
			return (
				<QueryClientProvider client={queryClient}>
					<ThemeProvider defaultTheme="system">
						{children}
					</ThemeProvider>
				</QueryClientProvider>
			);
		},
	});
	return router;
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof createRouter;
	}
}
