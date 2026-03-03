import React, {useEffect, useState} from 'react';
import {useMediaQuery} from "@uidotdev/usehooks";
import { ThemeContext, type Theme } from '@repo/contexts';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
                                                                           children,
                                                                       }) => {
    const [theme, setTheme] = useState<Theme>(
        (localStorage.getItem("theme") as Theme) || "SYSTEM"
    );

    const browserDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    const applyTheme = (currentTheme: Theme, systemDark: boolean) => {
        const root = document.documentElement;
        const effectiveDark =
            currentTheme === "SYSTEM" ? systemDark : currentTheme === "DARK";

        if (effectiveDark) {
            root.classList.add("dark");
            root.classList.remove("light");
        } else {
            root.classList.add("light");
            root.classList.remove("dark");
        }
    };

    useEffect(() => {
        applyTheme(theme, browserDarkMode);
    }, [theme, browserDarkMode]);

    const updateTheme = (theme: Theme, withSave?: boolean) => {
        setTheme(theme);
        localStorage.setItem("theme", theme);

        withSave ??= true;

        if (withSave) {
            // optional: set in user settings
        }
    };

    return (
        <ThemeContext.Provider value={{theme, updateTheme}}>
            {children}
        </ThemeContext.Provider>
    );
};