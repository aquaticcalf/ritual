import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
	Platform,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native"
import { CustomAlert } from "@/components/CustomAlert"
import { HeatMap } from "@/components/HeatMap"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { LogoIcon } from "@/components/ui/LogoIcon"
import { useThemeColor } from "@/hooks/useThemeColor"
import { reloadHabitReminders } from "@/lib/notifications"
import type { Habit } from "@/lib/types"

const HabitPage = () => {
	const _colorScheme = useColorScheme()
	const { habit } = useLocalSearchParams()
	const habitData: Habit | null =
		typeof habit === "string" ? JSON.parse(habit) : null
	const [showDeleteAlert, setShowDeleteAlert] = useState(false)
	const backgroundColor = useThemeColor({}, "background")
	const textColor = useThemeColor({}, "text")
	const cardBackgroundColor = useThemeColor({}, "card")
	const tintColor = useThemeColor({}, "tint")
	const navigation = useNavigation()
	const router = useRouter()

	const isWeb = Platform.OS === "web"

	const handleDelete = async () => {
		if (habitData) {
			try {
				const storedHabits = await AsyncStorage.getItem("habits")
				const habits = storedHabits ? JSON.parse(storedHabits) : []
				const updatedHabits = habits.filter((h: Habit) => h.id !== habitData.id)
				await AsyncStorage.setItem("habits", JSON.stringify(updatedHabits))

				// clear the current notification schedule for the habit
				await reloadHabitReminders(updatedHabits)

				router.push("/")
			} catch (error) {
				console.error("Failed to delete the habit:", error)
			}
		}
	}

	const confirmDelete = () => {
		if (isWeb) {
			// Use browser's confirm dialog for web
			if (window.confirm("Are you sure you want to delete this habit?")) {
				handleDelete()
			}
		} else {
			setShowDeleteAlert(true)
		}
	}

	useEffect(() => {
		if (habitData) {
			navigation.setOptions({
				headerTitle: () => (
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						{!habitData.icon || habitData.icon === "ritual-logo" ? (
							<LogoIcon
								width={24}
								height={24}
								color={textColor}
								style={{ marginRight: 8 }}
							/>
						) : (
							<MaterialIcons
								name={habitData.icon as string}
								size={24}
								color={textColor}
								style={{ marginRight: 8 }}
							/>
						)}
						<ThemedText
							style={{ fontSize: 17, fontWeight: "600", color: textColor }}
						>
							{habitData.name}
						</ThemedText>
					</View>
				),
			})
		}
	}, [habitData, textColor, navigation.setOptions])

	if (!habitData) {
		return (
			<ThemedView style={[styles.container, { backgroundColor }]}>
				<ThemedText style={[styles.title, { color: textColor }]}>
					Habit not found
				</ThemedText>
			</ThemedView>
		)
	}

	return (
		<ThemedView style={[styles.container, { backgroundColor }]}>
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				<ThemedView style={styles.statsContainer}>
					<ThemedView
						style={[styles.statBox, { backgroundColor: cardBackgroundColor }]}
					>
						<ThemedText style={[styles.statTitle, { color: textColor }]}>
							Current Streak
						</ThemedText>
						<View style={{ flexDirection: "row", alignItems: "center" }}>
							{!habitData?.icon || habitData?.icon === "ritual-logo" ? (
								<LogoIcon
									width={24}
									height={24}
									color={secondaryTextColor}
									style={{ marginRight: 4 }}
								/>
							) : (
								<MaterialIcons
									name="local-fire-department"
									size={24}
									color={secondaryTextColor}
								/>
							)}
							<ThemedText
								style={[
									styles.statValue,
									{ color: secondaryTextColor, marginLeft: 4 },
								]}
							>
								{habitData?.currentStreak}
							</ThemedText>
						</View>
					</ThemedView>
					<ThemedView
						style={[styles.statBox, { backgroundColor: cardBackgroundColor }]}
					>
						<ThemedText style={[styles.statTitle, { color: textColor }]}>
							Best Streak
						</ThemedText>
						<View style={{ flexDirection: "row", alignItems: "center" }}>
							<MaterialIcons
								name="local-fire-department"
								size={24}
								color={secondaryTextColor}
							/>
							<ThemedText
								style={[
									styles.statValue,
									{ color: secondaryTextColor, marginLeft: 4 },
								]}
							>
								{habitData.bestStreak}
							</ThemedText>
						</View>
					</ThemedView>
					<ThemedView
						style={[styles.statBox, { backgroundColor: cardBackgroundColor }]}
					>
						<ThemedText style={[styles.statTitle, { color: textColor }]}>
							Freezes
						</ThemedText>
						<View style={{ flexDirection: "row", alignItems: "center" }}>
							<MaterialIcons name="ac-unit" size={24} color="#4fc3f7" />
							<ThemedText
								style={[styles.statValue, { color: "#4fc3f7", marginLeft: 4 }]}
							>
								{habitData.freezesAvailable || 0}
							</ThemedText>
						</View>
					</ThemedView>
				</ThemedView>

				<ThemedView
					style={[styles.infoBox, { backgroundColor: cardBackgroundColor }]}
				>
					<ThemedText style={[styles.infoTitle, { color: textColor }]}>
						Frequency
					</ThemedText>
					<ThemedView
						style={[
							styles.frequencyContainer,
							{ backgroundColor: cardBackgroundColor },
						]}
					>
						{["S", "M", "T", "W", "Th", "F", "Sa"].map(day => (
							<ThemedView
								key={day}
								style={[
									styles.dayBadge,
									{
										backgroundColor: habitData.frequency.includes(day)
											? tintColor
											: "transparent",
										borderColor: secondaryTextColor,
									},
								]}
							>
								<ThemedText
									style={[
										styles.dayText,
										{
											color: habitData.frequency.includes(day)
												? backgroundColor
												: secondaryTextColor,
											fontWeight: habitData.frequency.includes(day)
												? "bold"
												: "normal",
										},
									]}
								>
									{day}
								</ThemedText>
							</ThemedView>
						))}
					</ThemedView>
				</ThemedView>

				{habitData.reminder && (
					<ThemedView
						style={[styles.infoBox, { backgroundColor: cardBackgroundColor }]}
					>
						<ThemedText style={[styles.infoTitle, { color: textColor }]}>
							Reminder Time
						</ThemedText>
						<ThemedText
							style={[styles.infoValue, { color: secondaryTextColor }]}
						>
							{habitData.reminderTime
								? new Date(habitData.reminderTime).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})
								: ""}
						</ThemedText>
					</ThemedView>
				)}

				<ThemedView
					style={[styles.infoBox, { backgroundColor: cardBackgroundColor }]}
				>
					<ThemedText style={[styles.infoTitle, { color: textColor }]}>
						Habit Created On
					</ThemedText>
					<ThemedText style={[styles.infoValue, { color: secondaryTextColor }]}>
						{new Date(habitData.createdOn).toLocaleDateString()}
					</ThemedText>
				</ThemedView>

				<ThemedView style={styles.header}>
					<TouchableOpacity
						style={[styles.button, { backgroundColor: cardBackgroundColor }]}
						onPress={() =>
							router.push({
								pathname: "/createHabit",
								params: { habit: JSON.stringify(habitData) },
							})
						}
					>
						<MaterialIcons name="edit" size={20} color={textColor} />
						<ThemedText
							style={[styles.buttonText, { color: secondaryTextColor }]}
						>
							{" "}
							Edit
						</ThemedText>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.button, { backgroundColor: cardBackgroundColor }]}
						onPress={confirmDelete}
					>
						<MaterialIcons name="delete" size={20} color={textColor} />
						<ThemedText
							style={[styles.buttonText, { color: secondaryTextColor }]}
						>
							{" "}
							Delete
						</ThemedText>
					</TouchableOpacity>
				</ThemedView>

				<HeatMap
					year={new Date().getFullYear()}
					heatMap={habitData.heatMap || []}
					freezeMap={habitData.freezeMap || []}
					createdOn={habitData.createdOn}
				/>
			</ScrollView>

			<CustomAlert
				visible={showDeleteAlert}
				title="Delete Habit"
				message="Are you sure you want to delete this habit?"
				buttons={[
					{
						text: "Cancel",
						onPress: () => setShowDeleteAlert(false),
						style: "cancel",
					},
					{
						text: "Delete",
						onPress: () => {
							setShowDeleteAlert(false)
							handleDelete()
						},
						style: "destructive",
					},
				]}
				onDismiss={() => setShowDeleteAlert(false)}
			/>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	scrollContainer: {
		flexGrow: 1,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
		gap: 10,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
	},
	statsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10,
		gap: 10,
	},
	statBox: {
		flex: 1,
		paddingVertical: 20,
		paddingHorizontal: 10,
		borderRadius: 10,
		alignItems: "center",
	},
	statTitle: {
		fontSize: 14,
		fontWeight: "bold",
	},
	statValue: {
		fontSize: 24,
		fontWeight: "bold",
		paddingVertical: 10,
	},
	infoBox: {
		padding: 20,
		borderRadius: 10,
		marginBottom: 10,
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "bold",
	},
	infoValue: {
		fontSize: 20,
		fontWeight: "bold",
	},
	button: {
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		flex: 1,
		padding: 20,
		borderRadius: 10,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 14,
		fontWeight: "light",
	},
	frequencyContainer: {
		flexDirection: "row",
		marginTop: 10,
		justifyContent: "space-between",
	},
	dayBadge: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		margin: 4,
		borderWidth: 1,
	},
	dayText: {
		fontSize: 14,
	},
})

export default HabitPage
