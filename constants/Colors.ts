/**
 * Updated light mode with softer, brighter colors to match a light theme.
 * Maintains visual harmony with the time picker component's color scheme.
 */

export const Colors = {
  light: {
    text: '#4A3B33',           // Dark foreground
    background: '#FDFBF7',     // Light background
    tint: '#D97706',          // Primary - Brighter orange-brown
    icon: '#D97706',          // Primary foreground - Matching tint
    tabIconDefault: '#78716C', // Muted foreground
    tabIconSelected: '#D97706', // Primary - Matching tint
    card: '#F8F4EE',          // Card background
    modalBackdrop: 'rgba(255, 255, 255, 0.7)',
    errorColor: '#991B1B',     // Destructive
    secondary: '#E4C090',      // Secondary
    accent: '#f2daba',         // Accent
    border: '#E4D9BC',         // Border
    input: '#E4D9BC',          // Input
    muted: '#F1E9DA',          // Muted
  },
  dark: {
    text: '#F5F5F4',           // Light foreground
    background: '#1C1917',     // Dark background
    tint: '#F97316',          // Primary
    icon: '#F97316',          // Primary foreground
    tabIconDefault: '#A8A29E', // Muted foreground
    tabIconSelected: '#F97316', // Primary
    card: '#292524',          // Card background
    modalBackdrop: 'rgba(0, 0, 0, 0.7)',
    errorColor: '#DC2626',     // Destructive
    secondary: '#57534E',      // Secondary
    accent: '#1e4252',         // Accent
    border: '#44403C',         // Border
    input: '#44403C',          // Input
    muted: '#292524',          // Muted
  },
};
