import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { routeTree } from "./routeTree.gen";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { ThemeProvider } from "./lib/theme";
import { PendingComponent } from "./components/PendingComponent";
import { NotFound } from "./components/NotFound";
import "./index.css";

const queryClient = new QueryClient();

const router = createRouter({
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

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<RouterProvider router={router} />
		</StrictMode>,
	);
}
