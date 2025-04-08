/**
 * Updated light mode with softer, brighter colors to match a light theme.
 * Maintains visual harmony with the time picker component's color scheme.
 */

const tintColorLight = '#FFB300';  // Yellow highlight
const tintColorDark = '#FFB300';   // Same highlight for dark theme

export const Colors = {
  light: {
    text: '#333333',           // Dark gray for readability on light background
    background: '#F5F5F5',     // Light gray background
    tint: tintColorLight,      
    icon: '#FFA000',           // Slightly softer yellow for icons
    tabIconDefault: '#A0A0A0', // Muted gray for unselected tabs
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',           // White cards for clarity
    modalBackdrop: 'rgba(255, 255, 255, 0.7)', // Translucent white backdrop
    errorColor: '#B00020',     // Standard error color
  },
  dark: {
    text: '#FFB300',           // Highlighted text
    background: '#1E1E1E',     // Dark background
    tint: tintColorDark,       
    icon: '#FFB300',           // Highlight icon
    tabIconDefault: '#B0B0B0', // Unselected tab
    tabIconSelected: tintColorDark,
    card: '#2E2E2E',           // Input field background
    modalBackdrop: 'rgba(0, 0, 0, 0.7)', // Translucent black backdrop
    errorColor: '#CF6679',     // Dark mode error color
  },
};
