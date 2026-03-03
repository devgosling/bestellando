import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./providers/ThemeProvider.tsx";
import { routeTree } from "./routeTree.gen";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/primereact.min.css";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: false,
			gcTime: 1000 * 60,
			refetchInterval: false,
		},
	},
});

export const router = createRouter({
	routeTree,
	context: {
		theme: undefined!,
		userContext: undefined!,
		queryClient,
	},
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
		routeMeta: {
			public?: boolean;
		};
	}
}

createRoot(document.getElementById("root")!).render(
	<QueryClientProvider client={queryClient}>
		<ThemeProvider>
			<PrimeReactProvider>
				<App />
			</PrimeReactProvider>
		</ThemeProvider>
	</QueryClientProvider>,
);
