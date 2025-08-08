import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from "expo-notifications"
import { useEffect, useState } from "react"
import {
	Modal,
	Platform,
	StyleSheet,
	Switch,
	TouchableOpacity,
	View,
} from "react-native"
import Toast from "react-native-toast-message"
// import { generateTestHabits } from '@/lib/testHabits';
import { CustomAlert } from "@/components/CustomAlert"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { useThemeColor } from "@/hooks/useThemeColor"
import {
	reloadHabitReminders,
	turnOffAllHabitReminders,
	turnOnAllHabitReminders,
} from "@/lib/notifications"
import {
	getThemePreference,
	saveThemePreference,
	type ThemePreference,
} from "@/lib/themeManager"

// Helper function to get display name for theme
const getThemeDisplayName = (themeValue: ThemePreference): string => {
	switch (themeValue) {
		case "light":
			return "Light"
		case "dark":
			return "Dark"
		case "system":
			return "System"
		default:
			return "System"
	}
}

export default function Settings() {
	const backgroundColor = useThemeColor({}, "background")
	const textColor = useThemeColor({}, "text")
	const buttonColor = useThemeColor({}, "tint")
	const habitItemBackgroundColor = useThemeColor({}, "card")
	const secondaryTextColor = useThemeColor({}, "tabIconDefault")

	const [theme, setTheme] = useState<ThemePreference>("system")
	const [notificationsEnabled, setNotificationsEnabled] = useState(true)
	const [themeModalVisible, setThemeModalVisible] = useState(false) // State for theme modal
	const [_showClearDataAlert, _setShowClearDataAlert] = useState(false)
	const [
		showNotificationsUnavailableAlert,
		setShowNotificationsUnavailableAlert,
	] = useState(false)
	const [showReloadSuccessAlert, setShowReloadSuccessAlert] = useState(false)
	const [showReloadErrorAlert, setShowReloadErrorAlert] = useState(false)
	const [_showTestAlert, _setShowTestAlert] = useState(false)
	const isWeb = Platform.OS === "web"

	useEffect(() => {
		// Load saved theme preference
		const loadTheme = async () => {
			const savedTheme = await getThemePreference()
			setTheme(savedTheme)
		}

		loadTheme()
	}, [])

	useEffect(() => {
		const fetchNotificationStatus = async () => {
			try {
				if (isWeb) {
					// Web platforms don't support notifications, default to false
					setNotificationsEnabled(false)
					return
				}

				const storedHabits = await AsyncStorage.getItem("habits")
				const _habits = storedHabits ? JSON.parse(storedHabits) : []
				const notifications =
					await Notifications.getAllScheduledNotificationsAsync()
				setNotificationsEnabled(notifications.length > 0)
			} catch (error) {
				console.error("Failed to fetch notification status:", error)
				setNotificationsEnabled(false)
			}
		}

		fetchNotificationStatus()
	}, [isWeb])

	const handleThemeChange = async (newTheme: string) => {
		await saveThemePreference(newTheme as ThemePreference)
		setTheme(newTheme as ThemePreference)
		setThemeModalVisible(false) // Close modal after selection

		Toast.show({
			type: "success",
			text1: "Theme updated",
			text2: `App theme set to ${getThemeDisplayName(newTheme as ThemePreference)}`,
			position: "bottom",
			visibilityTime: 2000,
		})
	}

	const handleReloadReminders = async () => {
		if (isWeb) {
			setShowNotificationsUnavailableAlert(true)
			return
		}

		try {
			const storedHabits = await AsyncStorage.getItem("habits")
			const habits = storedHabits ? JSON.parse(storedHabits) : []
			await reloadHabitReminders(habits)
			setShowReloadSuccessAlert(true)
		} catch (error) {
			console.error("Failed to reload habit reminders:", error)
			setShowReloadErrorAlert(true)
		}
	}

	const handleToggleNotifications = async () => {
		if (isWeb) {
			setShowNotificationsUnavailableAlert(true)
			return
		}

		try {
			const storedHabits = await AsyncStorage.getItem("habits")
			const habits = storedHabits ? JSON.parse(storedHabits) : []
			if (notificationsEnabled) {
				await turnOffAllHabitReminders()
			} else {
				await turnOnAllHabitReminders(habits)
			}
			setNotificationsEnabled(!notificationsEnabled)
		} catch (error) {
			console.error("Failed to toggle habit reminders:", error)
			setShowReloadErrorAlert(true)
		}
	}

	// const handleCreateTestHabits = async () => {
	//   // Check if today matches the test date (Tuesday, May 6, 2025)
	//   const today = new Date();
	//   const testDate = new Date(2025, 4, 6); // Month is 0-based, so 4 = May
	//   const isCorrectDate = today.getFullYear() === testDate.getFullYear() &&
	//                        today.getMonth() === testDate.getMonth() &&
	//                        today.getDate() === testDate.getDate();

	//   if (!isCorrectDate) {
	//     setShowTestAlert(true);
	//     return;
	//   }

	//   // If it matches the test date, proceed with creating test habits
	//   try {
	//     const testHabits = generateTestHabits();
	//     await AsyncStorage.setItem('habits', JSON.stringify(testHabits));

	//     Toast.show({
	//       type: 'success',
	//       text1: 'Test Habits Created',
	//       text2: '6 test habits have been created for testing',
	//       position: 'bottom',
	//       visibilityTime: 2000,
	//     });
	//   } catch (error) {
	//     console.error('Error creating test habits:', error);
	//     Toast.show({
	//       type: 'error',
	//       text1: 'Error',
	//       text2: 'Failed to create test habits',
	//       position: 'bottom',
	//     });
	//   }
	// };

	// const confirmClear = async () => {
	//   try {
	//     // Get current theme preference
	//     const themePreference = await AsyncStorage.getItem('themePreference');

	//     // Clear all data
	//     await AsyncStorage.clear();

	//     // Restore theme preference if it existed
	//     if (themePreference) {
	//       await AsyncStorage.setItem('themePreference', themePreference);
	//     }

	//     // Turn off all notifications since habits are cleared
	//     await turnOffAllHabitReminders();

	//     Toast.show({
	//       type: 'success',
	//       text1: 'Storage Cleared',
	//       text2: 'All habits have been cleared',
	//       position: 'bottom',
	//       visibilityTime: 2000,
	//     });
	//   } catch (error) {
	//     console.error('Error clearing storage:', error);
	//     Toast.show({
	//       type: 'error',
	//       text1: 'Error',
	//       text2: 'Failed to clear storage',
	//       position: 'bottom',
	//     });
	//   }
	// };

	// const handleClearStorage = async () => {
	//   if (Platform.OS === 'web') {
	//     if (window.confirm('Are you sure you want to clear all habits? This cannot be undone.')) {
	//       confirmClear();
	//     }
	//   } else {
	//     setShowClearDataAlert(true);
	//   }
	// };

	return (
		<ThemedView style={[styles.container, { backgroundColor }]}>
			<ThemedText style={[styles.header, { color: textColor }]}>
				Settings
			</ThemedText>
			<ThemedView style={styles.settingsContainer}>
				<ThemedText style={[styles.settingLabel, { color: textColor }]}>
					Theme
				</ThemedText>
				<TouchableOpacity
					style={[
						styles.settingItem,
						{ backgroundColor: habitItemBackgroundColor },
					]}
					onPress={() => setThemeModalVisible(true)}
				>
					<ThemedText style={[styles.settingItemText, { color: textColor }]}>
						Select Theme
					</ThemedText>
					<View style={styles.valueContainer}>
						<ThemedText
							style={[styles.settingItemValue, { color: secondaryTextColor }]}
						>
							{getThemeDisplayName(theme)}
						</ThemedText>
						<Ionicons
							name="chevron-forward"
							size={20}
							color={secondaryTextColor}
							style={styles.arrowIcon}
						/>
					</View>
				</TouchableOpacity>

				<ThemedText
					style={[styles.settingLabel, { color: textColor, marginTop: 15 }]}
				>
					Notifications
				</ThemedText>
				<ThemedView
					style={[
						styles.settingItem,
						{ backgroundColor: habitItemBackgroundColor, paddingVertical: 5 },
					]}
				>
					<ThemedText style={[styles.settingItemText, { color: textColor }]}>
						Enable Notifications
					</ThemedText>
					<Switch
						value={notificationsEnabled}
						onValueChange={handleToggleNotifications}
						disabled={isWeb}
						trackColor={{
							false: `${secondaryTextColor}40`,
							true: buttonColor,
						}}
						thumbColor={
							notificationsEnabled ? buttonColor : habitItemBackgroundColor
						}
						iosbackgroundColor={`${secondaryTextColor}40`}
					/>
				</ThemedView>

				<TouchableOpacity
					style={[
						styles.settingItem,
						{
							backgroundColor: habitItemBackgroundColor,
							opacity: isWeb || !notificationsEnabled ? 0.5 : 1,
						},
					]}
					onPress={handleReloadReminders}
					disabled={isWeb || !notificationsEnabled}
				>
					<ThemedText style={[styles.settingItemText, { color: textColor }]}>
						Reload Habit Reminders
					</ThemedText>
					<View style={styles.valueContainer}>
						<Ionicons name="reload" size={20} color={secondaryTextColor} />
					</View>
				</TouchableOpacity>
				{isWeb && (
					<ThemedText
						style={[styles.disclaimer, { color: secondaryTextColor }]}
					>
						*Notifications are not available on web platforms
					</ThemedText>
				)}
			</ThemedView>

			<Modal
				animationType="slide"
				transparent={true}
				visible={themeModalVisible}
				onRequestClose={() => setThemeModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<ThemedView
						style={[
							styles.modalContent,
							{ backgroundColor: habitItemBackgroundColor },
						]}
					>
						<ThemedText style={[styles.modalTitle, { color: textColor }]}>
							Select Theme
						</ThemedText>
						{["system", "light", "dark"].map((themeOption, index, arr) => (
							<TouchableOpacity
								key={themeOption}
								style={[
									styles.modalOption,
									index < arr.length - 1
										? {
												borderBottomWidth: StyleSheet.hairlineWidth,
												borderBottomColor: secondaryTextColor,
											}
										: {},
								]}
								onPress={() => handleThemeChange(themeOption)}
							>
								<ThemedText style={{ color: textColor, flex: 1 }}>
									{getThemeDisplayName(themeOption as ThemePreference)}
								</ThemedText>
								{theme === themeOption && (
									<ThemedText style={{ color: buttonColor }}>✓</ThemedText>
								)}
							</TouchableOpacity>
						))}
						<TouchableOpacity
							style={[
								styles.modalCloseButton,
								{ backgroundColor: `${secondaryTextColor}20` },
							]}
							onPress={() => setThemeModalVisible(false)}
						>
							<ThemedText
								style={[styles.modalCloseButtonText, { color: textColor }]}
							>
								Close
							</ThemedText>
						</TouchableOpacity>
					</ThemedView>
				</View>
			</Modal>

			{/* <CustomAlert
        visible={showClearDataAlert}
        title="Clear Habits Data"
        message="Are you sure you want to clear all habits? This cannot be undone."
        buttons={[
          {
            text: "Cancel",
            onPress: () => setShowClearDataAlert(false),
            style: "cancel"
          },
          {
            text: "Clear",
            onPress: () => {
              setShowClearDataAlert(false);
              confirmClear();
            },
            style: "destructive"
          }
        ]}
        onDismiss={() => setShowClearDataAlert(false)}
      /> */}

			<CustomAlert
				visible={showNotificationsUnavailableAlert}
				title="Not Available"
				message="Notifications are not available on web platforms"
				buttons={[
					{
						text: "OK",
						onPress: () => setShowNotificationsUnavailableAlert(false),
						style: "default",
					},
				]}
				onDismiss={() => setShowNotificationsUnavailableAlert(false)}
			/>

			<CustomAlert
				visible={showReloadSuccessAlert}
				title="Success"
				message="Habit reminders reloaded successfully"
				buttons={[
					{
						text: "OK",
						onPress: () => setShowReloadSuccessAlert(false),
						style: "default",
					},
				]}
				onDismiss={() => setShowReloadSuccessAlert(false)}
			/>

			<CustomAlert
				visible={showReloadErrorAlert}
				title="Error"
				message="Failed to reload habit reminders"
				buttons={[
					{
						text: "OK",
						onPress: () => setShowReloadErrorAlert(false),
						style: "default",
					},
				]}
				onDismiss={() => setShowReloadErrorAlert(false)}
			/>

			{/* <CustomAlert
        visible={showTestAlert}
        title="Test Habits Date Warning"
        message="The test habits are designed to work specifically on Tuesday (May 6, 2025) for accurate testing. Please modify the test data in testHabits.ts if testing on a different day."
        buttons={[
          {
            text: "OK",
            onPress: () => setShowTestAlert(false),
            style: "cancel"
          }
        ]}
        onDismiss={() => setShowTestAlert(false)}
      /> */}
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	header: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
		marginTop: 20,
	},
	settingsContainer: {
		display: "flex",
		flexDirection: "column",
		gap: 15,
	},
	settingLabel: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 5,
	},
	settingItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 15,
		paddingVertical: 18,
		borderRadius: 10,
	},
	disclaimer: {
		fontSize: 12,
		opacity: 0.6,
		paddingHorizontal: 5,
	},
	button: {
		padding: 15,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 10,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "bold",
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	modalContent: {
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 30,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 20,
		textAlign: "center",
	},
	modalOption: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 15,
	},
	modalCloseButton: {
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 20,
	},
	modalCloseButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	settingItemText: {
		flex: 1,
	},
	settingItemValue: {
		marginRight: 5,
	},
	valueContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	arrowIcon: {
		fontSize: 18,
		marginLeft: 3,
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 10,
	},
	dangerButton: {
		backgroundColor: "#DC2626", // Error red color
	},
})
