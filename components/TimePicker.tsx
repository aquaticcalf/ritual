import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Button, MD3DarkTheme } from "react-native-paper";
import { TimePickerModal } from "react-native-paper-dates";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import { Colors } from "@/constants/Colors";

interface TimePickerProps {
  isEditing: boolean;
  time: Date;
  onTimeChange: (selectedTime: Date | undefined) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ isEditing, time, onTimeChange }) => {
  const [visible, setVisible] = useState(isEditing ? false : true);
  
  // Get dark theme colors regardless of system theme
  const backgroundColor = Colors.dark.background;
  const textColor = Colors.dark.text;
  const buttonColor = Colors.dark.tint;
  const cardColor = Colors.dark.card;
  const tabIconDefault = Colors.dark.tabIconDefault;
  const iconColor = Colors.dark.icon;
  
  // Use MD3 dark theme as base
  const baseTheme = MD3DarkTheme;

  // Always use dark theme colors
  const themeColors = Colors.dark;

  // Create a complete theme object for PaperProvider with all MD3 properties
  const paperTheme = {
    ...baseTheme,
    dark: true,
    version: 3 as const,
    colors: {
      ...baseTheme.colors,
      // Primary colors (main action colors)
      primary: buttonColor,
      onPrimary: themeColors.card,
      primaryContainer: themeColors.background,
      onPrimaryContainer: buttonColor,
      
      // Secondary colors (complementary actions)
      secondary: iconColor,
      onSecondary: themeColors.background,
      secondaryContainer: themeColors.card,
      onSecondaryContainer: buttonColor,
      
      // Tertiary colors (alternative actions)
      tertiary: iconColor,
      onTertiary: themeColors.background,
      tertiaryContainer: themeColors.card,
      onTertiaryContainer: buttonColor,
      
      // Neutral colors (backgrounds) - ENSURING SOLID COLORS HERE
      background: backgroundColor, // Solid background
      onBackground: textColor,
      surface: cardColor, // Solid surface color for modal
      onSurface: textColor,
      surfaceVariant: themeColors.background,
      onSurfaceVariant: themeColors.tabIconDefault,
      
      // Additional surface colors (disabled states)
      surfaceDisabled: themeColors.card + '40',
      onSurfaceDisabled: themeColors.tabIconDefault,
      
      // Outline
      outline: themeColors.tabIconDefault,
      outlineVariant: themeColors.card,
      
      // Error colors
      error: themeColors.errorColor,
      onError: themeColors.background,
      errorContainer: themeColors.errorColor + '20',
      onErrorContainer: themeColors.errorColor,
      
      // Misc colors
      shadow: themeColors.background + '40',
      inverseSurface: themeColors.card,
      inverseOnSurface: themeColors.background,
      inversePrimary: themeColors.background,
      backdrop: themeColors.modalBackdrop,
      
      // Plain text color
      text: textColor,
      
      // For placeholder text
      placeholder: tabIconDefault,
      
      // Elevation (for tinting surfaces) - NO TRANSPARENCY FOR SURFACES
      elevation: {
        level0: 'transparent',
        level1: themeColors.card,
        level2: themeColors.card,
        level3: themeColors.card,
        level4: themeColors.card,
        level5: themeColors.card,
      },
    },
    roundness: 8,
    fonts: baseTheme.fonts,
    animation: {
      scale: 1.0,
    },
  };

  const onDismiss = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const onConfirm = useCallback(
    ({ hours, minutes }: { hours: number; minutes: number }) => {
      setVisible(false);
      const selectedTime = new Date();
      selectedTime.setHours(hours);
      selectedTime.setMinutes(minutes);
      onTimeChange(selectedTime);
    },
    [setVisible, onTimeChange]
  );

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Button 
          mode="contained" 
          onPress={() => setVisible(true)}
          buttonColor={buttonColor}
          textColor={themeColors.card}
        >
          {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Set Time"}
        </Button>
        <PaperProvider theme={paperTheme}>
          <TimePickerModal
            visible={visible}
            onDismiss={onDismiss}
            onConfirm={onConfirm}
            hours={time.getHours()}
            minutes={time.getMinutes()}
            animationType="fade"
          />
        </PaperProvider>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
});

export default TimePicker;