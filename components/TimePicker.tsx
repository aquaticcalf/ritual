import type React from "react"
import { useCallback, useState } from "react"
import { StyleSheet, View } from "react-native"
import {
	Button,
	MD3DarkTheme,
	MD3LightTheme,
	Provider as PaperProvider,
} from "react-native-paper"
import { TimePickerModal } from "react-native-paper-dates"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { useColorScheme } from "@/hooks/useColorScheme"

interface TimePickerProps {
	isEditing: boolean
	time: Date
	onTimeChange: (selectedTime: Date | undefined) => void
}

const TimePicker: React.FC<TimePickerProps> = ({
	isEditing,
	time,
	onTimeChange,
}) => {
	const [visible, setVisible] = useState(!isEditing)
	const colorScheme = useColorScheme()

	// Define light theme colors
	const lightThemeColors = {
		background: "#FDFBF7",
		text: "#4A3B33",
		primary: "#B45309",
		card: "#F8F4EE",
		secondary: "#E4C090",
		accent: "#f2daba",
		border: "#E4D9BC",
		muted: "#78716C",
		error: "#991B1B",
	}

	// Define dark theme colors
	const darkThemeColors = {
		background: "#1C1917",
		text: "#F5F5F4",
		primary: "#F97316",
		card: "#292524",
		secondary: "#57534E",
		accent: "#1e4252",
		border: "#44403C",
		muted: "#A8A29E",
		error: "#DC2626",
	}

	// Use colors based on theme
	const themeColors =
		colorScheme === "dark" ? darkThemeColors : lightThemeColors
	const baseTheme = colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme

	// Create a complete theme object for PaperProvider with all MD3 properties
	const paperTheme = {
		...baseTheme,
		dark: colorScheme === "dark",
		version: 3 as const,
		colors: {
			...baseTheme.colors,
			// Primary colors (main action colors)
			primary: themeColors.primary,
			onPrimary: themeColors.card,
			primaryContainer: themeColors.background,
			onPrimaryContainer: themeColors.primary,

			// Secondary colors (complementary actions)
			secondary: themeColors.secondary,
			onSecondary: themeColors.background,
			secondaryContainer: themeColors.card,
			onSecondaryContainer: themeColors.primary,

			// Tertiary colors (alternative actions)
			tertiary: themeColors.accent,
			onTertiary: themeColors.background,
			tertiaryContainer: themeColors.card,
			onTertiaryContainer: themeColors.primary,

			// Neutral colors (backgrounds)
			background: themeColors.background,
			onBackground: themeColors.text,
			surface: themeColors.card,
			onSurface: themeColors.text,
			surfaceVariant: themeColors.background,
			onSurfaceVariant: themeColors.muted,

			// Additional surface colors
			surfaceDisabled: `${themeColors.card}40`,
			onSurfaceDisabled: themeColors.muted,

			// Outline
			outline: themeColors.border,
			outlineVariant: themeColors.card,

			// Error colors
			error: themeColors.error,
			onError: colorScheme === "dark" ? "#FFFFFF" : themeColors.background,
			errorContainer: `${themeColors.error}20`,
			onErrorContainer: themeColors.error,

			// Misc colors
			shadow: `${themeColors.background}40`,
			inverseSurface: themeColors.card,
			inverseOnSurface: themeColors.background,
			inversePrimary: themeColors.background,
			backdrop:
				colorScheme === "dark"
					? "rgba(0, 0, 0, 0.7)"
					: "rgba(255, 255, 255, 0.7)",

			// Plain text color
			text: themeColors.text,

			// For placeholder text
			placeholder: themeColors.muted,

			// Elevation (for tinting surfaces)
			elevation: {
				level0: "transparent",
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
	}

	const onDismiss = useCallback(() => {
		setVisible(false)
	}, [])

	const onConfirm = useCallback(
		({ hours, minutes }: { hours: number; minutes: number }) => {
			setVisible(false)
			const selectedTime = new Date()
			selectedTime.setHours(hours)
			selectedTime.setMinutes(minutes)
			onTimeChange(selectedTime)
		},
		[onTimeChange],
	)

	return (
		<SafeAreaProvider>
			<View style={styles.container}>
				<Button
					mode="contained"
					onPress={() => setVisible(true)}
					buttonColor={themeColors.primary}
					textColor={themeColors.background}
				>
					{time
						? time.toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})
						: "Set Time"}
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
	)
}

const styles = StyleSheet.create({
	container: {
		marginTop: 10,
	},
})

export default TimePicker
