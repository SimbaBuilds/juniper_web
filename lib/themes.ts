export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface Theme {
  name: string;
  displayName: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export const themes: Record<string, Theme> = {
  default: {
    name: 'default',
    displayName: 'Default',
    light: {
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.145 0 0)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.145 0 0)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.145 0 0)',
      primary: 'oklch(0.3 0.08 200)',
      primaryForeground: 'oklch(0.985 0 0)',
      secondary: 'oklch(0.95 0.02 160)',
      secondaryForeground: 'oklch(0.25 0.04 200)',
      muted: 'oklch(0.96 0.015 150)',
      mutedForeground: 'oklch(0.5 0.04 180)',
      accent: 'oklch(0.92 0.03 140)',
      accentForeground: 'oklch(0.25 0.04 200)',
      destructive: 'oklch(0.577 0.245 27.325)',
      border: 'oklch(0.922 0 0)',
      input: 'oklch(0.922 0 0)',
      ring: 'oklch(0.708 0 0)',
      sidebar: 'oklch(0.985 0 0)',
      sidebarForeground: 'oklch(0.145 0 0)',
      sidebarPrimary: 'oklch(0.205 0 0)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)',
      sidebarAccent: 'oklch(0.97 0 0)',
      sidebarAccentForeground: 'oklch(0.205 0 0)',
      sidebarBorder: 'oklch(0.922 0 0)',
      sidebarRing: 'oklch(0.708 0 0)',
      chart1: 'oklch(0.6 0.15 160)',
      chart2: 'oklch(0.55 0.12 220)',
      chart3: 'oklch(0.65 0.14 140)',
      chart4: 'oklch(0.7 0.1 200)',
      chart5: 'oklch(0.6 0.13 180)',
    },
    dark: {
      background: 'oklch(0.145 0 0)',
      foreground: 'oklch(0.985 0 0)',
      card: 'oklch(0.205 0 0)',
      cardForeground: 'oklch(0.985 0 0)',
      popover: 'oklch(0.205 0 0)',
      popoverForeground: 'oklch(0.985 0 0)',
      primary: 'oklch(0.7 0.08 160)',
      primaryForeground: 'oklch(0.1 0.02 160)',
      secondary: 'oklch(0.3 0.04 200)',
      secondaryForeground: 'oklch(0.9 0.02 160)',
      muted: 'oklch(0.25 0.03 180)',
      mutedForeground: 'oklch(0.65 0.03 160)',
      accent: 'oklch(0.35 0.05 140)',
      accentForeground: 'oklch(0.9 0.02 140)',
      destructive: 'oklch(0.704 0.191 22.216)',
      border: 'oklch(1 0 0 / 10%)',
      input: 'oklch(1 0 0 / 15%)',
      ring: 'oklch(0.556 0 0)',
      sidebar: 'oklch(0.205 0 0)',
      sidebarForeground: 'oklch(0.985 0 0)',
      sidebarPrimary: 'oklch(0.488 0.243 264.376)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)',
      sidebarAccent: 'oklch(0.269 0 0)',
      sidebarAccentForeground: 'oklch(0.985 0 0)',
      sidebarBorder: 'oklch(1 0 0 / 10%)',
      sidebarRing: 'oklch(0.556 0 0)',
      chart1: 'oklch(0.65 0.15 160)',
      chart2: 'oklch(0.6 0.12 220)',
      chart3: 'oklch(0.7 0.14 140)',
      chart4: 'oklch(0.75 0.1 200)',
      chart5: 'oklch(0.65 0.13 180)',
    },
  },
  vintage: {
    name: 'vintage',
    displayName: 'Vintage Beige',
    light: {
      background: 'oklch(0.95 0.02 85)',
      foreground: 'oklch(0.25 0.03 75)',
      card: 'oklch(0.97 0.015 85)',
      cardForeground: 'oklch(0.25 0.03 75)',
      popover: 'oklch(0.97 0.015 85)',
      popoverForeground: 'oklch(0.25 0.03 75)',
      primary: 'oklch(0.4 0.08 75)',
      primaryForeground: 'oklch(0.95 0.02 85)',
      secondary: 'oklch(0.9 0.025 80)',
      secondaryForeground: 'oklch(0.35 0.04 75)',
      muted: 'oklch(0.88 0.025 80)',
      mutedForeground: 'oklch(0.5 0.04 75)',
      accent: 'oklch(0.85 0.03 80)',
      accentForeground: 'oklch(0.3 0.04 75)',
      destructive: 'oklch(0.55 0.15 25)',
      border: 'oklch(0.82 0.03 80)',
      input: 'oklch(0.82 0.03 80)',
      ring: 'oklch(0.6 0.06 75)',
      sidebar: 'oklch(0.92 0.02 140)',
      sidebarForeground: 'oklch(0.25 0.03 160)',
      sidebarPrimary: 'oklch(0.4 0.08 160)',
      sidebarPrimaryForeground: 'oklch(0.95 0.02 140)',
      sidebarAccent: 'oklch(0.85 0.03 180)',
      sidebarAccentForeground: 'oklch(0.3 0.04 160)',
      sidebarBorder: 'oklch(0.82 0.03 140)',
      sidebarRing: 'oklch(0.6 0.06 160)',
      chart1: 'oklch(0.6 0.12 160)',
      chart2: 'oklch(0.55 0.15 220)',
      chart3: 'oklch(0.5 0.08 30)',
      chart4: 'oklch(0.65 0.1 120)',
      chart5: 'oklch(0.7 0.12 280)',
    },
    dark: {
      background: 'oklch(0.15 0.02 75)',
      foreground: 'oklch(0.9 0.02 85)',
      card: 'oklch(0.2 0.025 75)',
      cardForeground: 'oklch(0.9 0.02 85)',
      popover: 'oklch(0.2 0.025 75)',
      popoverForeground: 'oklch(0.9 0.02 85)',
      primary: 'oklch(0.75 0.05 85)',
      primaryForeground: 'oklch(0.2 0.025 75)',
      secondary: 'oklch(0.25 0.03 75)',
      secondaryForeground: 'oklch(0.85 0.02 85)',
      muted: 'oklch(0.28 0.03 75)',
      mutedForeground: 'oklch(0.65 0.03 80)',
      accent: 'oklch(0.35 0.04 75)',
      accentForeground: 'oklch(0.85 0.02 85)',
      destructive: 'oklch(0.65 0.12 25)',
      border: 'oklch(0.9 0.02 85 / 15%)',
      input: 'oklch(0.9 0.02 85 / 20%)',
      ring: 'oklch(0.55 0.04 80)',
      sidebar: 'oklch(0.18 0.025 140)',
      sidebarForeground: 'oklch(0.9 0.02 160)',
      sidebarPrimary: 'oklch(0.6 0.1 160)',
      sidebarPrimaryForeground: 'oklch(0.9 0.02 160)',
      sidebarAccent: 'oklch(0.25 0.03 180)',
      sidebarAccentForeground: 'oklch(0.85 0.02 140)',
      sidebarBorder: 'oklch(0.9 0.02 160 / 15%)',
      sidebarRing: 'oklch(0.55 0.04 160)',
      chart1: 'oklch(0.65 0.12 160)',
      chart2: 'oklch(0.6 0.15 220)',
      chart3: 'oklch(0.7 0.12 280)',
      chart4: 'oklch(0.55 0.1 120)',
      chart5: 'oklch(0.75 0.08 30)',
    },
  },
};

export type ThemeName = keyof typeof themes;

export function getThemeColors(themeName: ThemeName, mode: 'light' | 'dark'): ThemeColors {
  return themes[themeName]?.[mode] || themes.default[mode];
}

export function getCSSVariables(themeName: ThemeName, mode: 'light' | 'dark'): Record<string, string> {
  const colors = getThemeColors(themeName, mode);
  return {
    '--background': colors.background,
    '--foreground': colors.foreground,
    '--card': colors.card,
    '--card-foreground': colors.cardForeground,
    '--popover': colors.popover,
    '--popover-foreground': colors.popoverForeground,
    '--primary': colors.primary,
    '--primary-foreground': colors.primaryForeground,
    '--secondary': colors.secondary,
    '--secondary-foreground': colors.secondaryForeground,
    '--muted': colors.muted,
    '--muted-foreground': colors.mutedForeground,
    '--accent': colors.accent,
    '--accent-foreground': colors.accentForeground,
    '--destructive': colors.destructive,
    '--border': colors.border,
    '--input': colors.input,
    '--ring': colors.ring,
    '--sidebar': colors.sidebar,
    '--sidebar-foreground': colors.sidebarForeground,
    '--sidebar-primary': colors.sidebarPrimary,
    '--sidebar-primary-foreground': colors.sidebarPrimaryForeground,
    '--sidebar-accent': colors.sidebarAccent,
    '--sidebar-accent-foreground': colors.sidebarAccentForeground,
    '--sidebar-border': colors.sidebarBorder,
    '--sidebar-ring': colors.sidebarRing,
    '--chart-1': colors.chart1,
    '--chart-2': colors.chart2,
    '--chart-3': colors.chart3,
    '--chart-4': colors.chart4,
    '--chart-5': colors.chart5,
  };
}