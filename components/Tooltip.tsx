import { useEffect } from "react"
import {
	Dimensions,
	Modal,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from "react-native"
import { useThemeColor } from "@/hooks/useThemeColor"
import { ThemedText } from "./ThemedText"
import { ThemedView } from "./ThemedView"

interface TooltipProps {
	isVisible: boolean
	onClose: () => void
	text: string
	x: number
	y: number
}

export function Tooltip({ isVisible, onClose, text, x, y }: TooltipProps) {
	const backgroundColor = useThemeColor({}, "card")
	const _textColor = useThemeColor({}, "text")
	const secondaryTextColor = useThemeColor({}, "tabIconDefault")

	useEffect(() => {
		if (isVisible) {
			const timer = setTimeout(() => {
				onClose()
			}, 2000) // 2 seconds

			return () => clearTimeout(timer)
		}
	}, [isVisible, onClose])

	const screenWidth = Dimensions.get("window").width
	const tooltipWidth = 280

	// Calculate the left position, ensuring the tooltip stays within screen bounds
	let leftPosition = Math.min(
		x - tooltipWidth / 2, // Try to center on x
		screenWidth - tooltipWidth - 20, // Don't go past right edge (with 20px padding)
	)

	// Don't go past left edge
	leftPosition = Math.max(20, leftPosition)

	// Calculate arrow position relative to the tooltip
	const arrowLeftPosition = Math.min(
		Math.max(20, x - leftPosition - 8), // Center arrow on x position
		tooltipWidth - 16, // Don't let arrow go past right edge of tooltip
	)

	return (
		<Modal
			transparent={true}
			visible={isVisible}
			animationType="fade"
			onRequestClose={onClose}
		>
			<TouchableWithoutFeedback onPress={onClose}>
				<View style={styles.modalOverlay}>
					<ThemedView
						style={[
							styles.tooltipContainer,
							{
								backgroundColor,
								position: "absolute",
								top: y,
								left: leftPosition,
								transform: [{ translateY: 15 }],
							},
						]}
					>
						<View
							style={[
								styles.arrow,
								{
									borderBottomColor: backgroundColor,
									top: -8,
									left: arrowLeftPosition,
								},
							]}
						/>
						<ThemedText
							style={[styles.tooltipText, { color: secondaryTextColor }]}
						>
							{text}
						</ThemedText>
					</ThemedView>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	)
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.1)",
	},
	tooltipContainer: {
		padding: 12,
		borderRadius: 8,
		maxWidth: 280,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	tooltipText: {
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
	},
	arrow: {
		position: "absolute",
		marginLeft: -8,
		borderLeftWidth: 8,
		borderRightWidth: 8,
		borderBottomWidth: 8,
		borderStyle: "solid",
		backgroundColor: "transparent",
		borderLeftColor: "transparent",
		borderRightColor: "transparent",
	},
})
