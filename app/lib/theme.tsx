import {
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { createContext, useContext, useEffect, useMemo } from "react";
import { z } from "zod";

// Edit to fit your needs (warning: system theme causes flash on initial load when not default, due to non blocking)
const DEFAULT_THEME: Theme = "system";
const DEFAULT_SYSTEM_THEME: SystemTheme = "light";

// Types and constants
export const themes = ["light", "dark", "system"] as const;
export const themeSchema = z.enum(themes);

export type Theme = "light" | "dark" | "system";
export type SystemTheme = "dark" | "light";

type ThemeProviderState = {
	systemTheme: SystemTheme;
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

// Persistence
const getThemeFn = createServerFn({ method: "GET" }).handler(() => {
	return {
		theme: (getCookie("theme") as Theme | undefined) ?? DEFAULT_THEME,
		systemTheme:
			(getCookie("systemTheme") as SystemTheme | undefined) ??
			DEFAULT_SYSTEM_THEME,
	};
});
const setThemeFn = createServerFn({ method: "POST" })
	.validator(
		z.object({
			theme: z.enum(["light", "dark", "system"]),
			systemTheme: z.enum(["dark", "light"]),
		}),
	)
	.handler(({ data: { theme, systemTheme } }) => {
		setCookie("theme", theme);
		setCookie("systemTheme", systemTheme);
	});
export const getThemeQueryOptions = queryOptions({
	queryKey: ["theme"],
	queryFn: getThemeFn,
});

const ThemeProviderContext = createContext<ThemeProviderState>({
	systemTheme: DEFAULT_SYSTEM_THEME,
	theme: DEFAULT_THEME,
	setTheme: () => null,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	const queryClient = useQueryClient();
	const {
		data: { theme, systemTheme },
	} = useSuspenseQuery(getThemeQueryOptions);
	const updateTheme = useMutation({
		mutationFn: setThemeFn,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: getThemeQueryOptions.queryKey,
			});
		},
	});

	useEffect(() => {
		const root = window.document.documentElement;
		root.classList.remove("light", "dark");
		const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
			.matches
			? "dark"
			: "light";

		root.classList.add(theme === "system" ? systemTheme : theme);
		updateTheme.mutate({
			data: {
				theme,
				systemTheme,
			},
		});
	}, [theme, systemTheme]);

	const value = useMemo(
		() => ({
			systemTheme,
			theme,
			setTheme: (theme: Theme) =>
				updateTheme.mutate({
					data: {
						theme,
						systemTheme,
					},
				}),
		}),
		[systemTheme, theme, updateTheme],
	);

	return (
		<ThemeProviderContext.Provider value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
