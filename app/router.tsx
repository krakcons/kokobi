import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createRouter as createTanStackRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { FloatingPage } from "./components/Page";
import { LoaderCircle } from "lucide-react";

const queryClient = new QueryClient();

const router = createTanStackRouter({
	routeTree,
	context: { queryClient },
	defaultPreload: "intent",
	defaultErrorComponent: DefaultCatchBoundary,
	defaultNotFoundComponent: () => <NotFound />,
	defaultPendingComponent: () => (
		<FloatingPage>
			<LoaderCircle className="animate-spin size-12" />
		</FloatingPage>
	),
	scrollRestoration: true,
	Wrap: ({ children }) => {
		return (
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		);
	},
});

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
