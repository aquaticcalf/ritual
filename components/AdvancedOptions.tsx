import { MaterialIcons } from "@expo/vector-icons"
import type React from "react"
import { StyleSheet, TextInput, TouchableOpacity } from "react-native"
import { ThemedText } from "./ThemedText"
import { ThemedView } from "./ThemedView"

interface AdvancedOptionsProps {
	showAdvancedOptions: boolean
	setShowAdvancedOptions: (show: boolean) => void
	initialStreak: number
	setInitialStreak: (streak: number) => void
	backgroundColor: string
	textColor: string
	inputBackgroundColor: string
	buttonColor: string
	dayColor: string
}

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
	showAdvancedOptions,
	setShowAdvancedOptions,
	initialStreak,
	setInitialStreak,
	backgroundColor,
	textColor,
	inputBackgroundColor,
	buttonColor,
	dayColor,
}) => {
	const MAX_STREAK = 10

	return (
		<ThemedView style={styles.advancedOptionsContainer}>
			<TouchableOpacity
				style={styles.advancedOptionsHeader}
				onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
			>
				<ThemedText style={[styles.label, { color: textColor }]}>
					Advanced Options
				</ThemedText>
				<MaterialIcons
					name={showAdvancedOptions ? "expand-less" : "expand-more"}
					size={24}
					color={textColor}
				/>
			</TouchableOpacity>

			{showAdvancedOptions && (
				<ThemedView style={styles.advancedOptionsContent}>
					<ThemedText
						style={[styles.label, { color: textColor, marginTop: 15 }]}
					>
						Initial Streak
					</ThemedText>
					<ThemedText style={[styles.subLabel, { color: dayColor }]}>
						Set a starting streak if you're already tracking this habit
						elsewhere (max {MAX_STREAK})
					</ThemedText>

					<ThemedView style={styles.streakInputContainer}>
						<TouchableOpacity
							style={[
								styles.streakButton,
								{ backgroundColor: buttonColor },
								initialStreak <= 0 ? { opacity: 0.5 } : {},
							]}
							onPress={() =>
								initialStreak > 0 && setInitialStreak(initialStreak - 1)
							}
							disabled={initialStreak <= 0}
						>
							<MaterialIcons name="remove" size={20} color={backgroundColor} />
						</TouchableOpacity>

						<TextInput
							style={[
								styles.streakInput,
								{ color: textColor, backgroundColor: inputBackgroundColor },
							]}
							value={initialStreak.toString()}
							onChangeText={text => {
								const numericValue = text.replace(/[^0-9]/g, "")
								const parsedValue = Number.parseInt(numericValue) || 0
								// Cap the value between 0 and MAX_STREAK (10)
								setInitialStreak(Math.min(Math.max(0, parsedValue), MAX_STREAK))
							}}
							keyboardType="numeric"
							placeholder="0"
							placeholderTextColor={dayColor}
						/>

						<TouchableOpacity
							style={[
								styles.streakButton,
								{ backgroundColor: buttonColor },
								initialStreak >= MAX_STREAK ? { opacity: 0.5 } : {},
							]}
							onPress={() =>
								initialStreak < MAX_STREAK &&
								setInitialStreak(initialStreak + 1)
							}
							disabled={initialStreak >= MAX_STREAK}
						>
							<MaterialIcons name="add" size={20} color={backgroundColor} />
						</TouchableOpacity>
					</ThemedView>
				</ThemedView>
			)}
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	advancedOptionsContainer: {
		marginTop: 20,
		borderRadius: 10,
	},
	advancedOptionsHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
	},
	advancedOptionsContent: {
		marginTop: 5,
		paddingBottom: 10,
	},
	label: {
		fontSize: 16,
		fontWeight: "bold",
	},
	subLabel: {
		fontSize: 12,
		marginTop: 5,
	},
	streakInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 10,
	},
	streakInput: {
		flex: 1,
		fontSize: 16,
		padding: 10,
		borderRadius: 10,
		textAlign: "center",
		marginHorizontal: 10,
	},
	streakButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},
})
