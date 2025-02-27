import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createRouter as createTanStackRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { routeTree } from "./routeTree.gen";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { ThemeProvider } from "./lib/theme";
import { PendingComponent } from "./components/PendingComponent";
import { NotFound } from "./components/NotFound";

const queryClient = new QueryClient();

const router = createTanStackRouter({
	routeTree,
	context: { queryClient },
	defaultPreload: "intent",
	defaultErrorComponent: DefaultCatchBoundary,
	scrollRestoration: true,
	defaultNotFoundComponent: () => <NotFound />,
	defaultPendingComponent: PendingComponent,
	Wrap: ({ children }) => {
		return (
			<QueryClientProvider client={queryClient}>
				<ThemeProvider defaultTheme="system">{children}</ThemeProvider>
			</QueryClientProvider>
		);
	},
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const elem = document.getElementById("root")!;
const app = (
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>
);

console.log("TEST");

if (import.meta.hot) {
	// With hot module reloading, `import.meta.hot.data` is persisted.
	const root = (import.meta.hot.data.root ??= createRoot(elem));
	root.render(app);
} else {
	// The hot module reloading API is not available in production.
	createRoot(elem).render(app);
}
