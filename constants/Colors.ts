/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

const tintColorLight = '#8A4FFF';  // Vibrant purple for light mode
const tintColorDark = '#B088FF';   // Brighter neon purple for dark mode

export const Colors = {
  light: {
    text: '#2D2D2D',         // Dark charcoal
    background: '#F6F4FF',   // Very light lavender background
    tint: tintColorLight,    
    icon: '#5B3E96',         // Deep plum for icons
    tabIconDefault: '#9E8BC4',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',         // White cards with light lavender shadow
  },
  dark: {
    text: '#F0F0F0',         // Soft white text
    background: '#18141F',   // Deep charcoal with purple undertones
    tint: tintColorDark,     
    icon: '#C4B5FF',         // Light lavender icons
    tabIconDefault: '#7F6BA8',
    tabIconSelected: tintColorDark,
    card: '#241F2F',         // Slightly lighter dark purple
  },
};
