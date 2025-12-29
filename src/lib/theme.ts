export type ThemeColors = {
    primary: string;
    primaryForeground: string;
    // Add more as needed
};

export function applyTheme(colors: Partial<ThemeColors>) {
    const root = document.documentElement;

    if (colors.primary) {
        // Convert hex to HSL if needed, or assume HSL string is passed
        // For now, assuming the input is compatible with our CSS variable format (HSL space separated)
        root.style.setProperty('--primary', colors.primary);
    }
    if (colors.primaryForeground) {
        root.style.setProperty('--primary-foreground', colors.primaryForeground);
    }
}
