/**
 * Fire-themed color palette that embodies energy, motivation, and progress.
 * These colors are designed to evoke the feeling of building "streaks" of habits.
 */

const tintColorLight = '#FF5722';  // Vibrant flame orange for light mode
const tintColorDark = '#FFB74D';   // Glowing ember orange for dark mode

export const Colors = {
  light: {
    text: '#2D1506',         // Deep charred wood brown
    background: '#FFF8E1',   // Warm parchment (slightly off-white)
    tint: tintColorLight,    
    icon: '#D84315',         // Deep ember red
    tabIconDefault: '#BFA189',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',         // White with warm undertones
  },
  dark: {
    text: '#FFF3E0',         // Soft flame glow
    background: '#1A0F0F',   // Deep charcoal with red undertones
    tint: tintColorDark,     
    icon: '#FFCC80',         // Bright flame yellow
    tabIconDefault: '#AD6C43',
    tabIconSelected: tintColorDark,
    card: '#2C1A1A',         // Smoldering coal
  },
};
