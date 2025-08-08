import type React from "react"
import { StyleSheet, Text } from "react-native"
import { useThemeColor } from "@/hooks/useThemeColor"
import { ThemedView } from "./ThemedView"

interface MonthComponentProps {
	/** 0-based index of the month: 0=January, 1=February, ... 11=December */
	month: number
	/** 0 for Sunday, 1 for Monday, ... 6 for Saturday */
	firstDay: number
	/** If true, use 29 days for February */
	isLeapYear: boolean
	/** List of dates to highlight in green */
	greens: number[]
	/** List of dates to highlight in blue */
	blues?: number[]
	/** If true, this entire month is before the habit was created */
	isBeforeCreationMonth?: boolean
	/** If > 0, days before this day in this month should be dimmed */
	creationDay?: number
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const LEAP_YEAR_DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const MonthComponent: React.FC<MonthComponentProps> = ({
	month,
	firstDay,
	isLeapYear,
	greens,
	blues = [],
	isBeforeCreationMonth = false,
	creationDay = -1,
}) => {
	const backgroundColor = useThemeColor({}, "background")
	const greenColor = useThemeColor({}, "tint")
	const blueColor = useThemeColor({}, "frozenBackground")
	const grayColor = useThemeColor({}, "tabIconDefault")
	const textColorOnColored = useThemeColor({}, "background")
	const textColorOnGray = grayColor

	const daysInMonth = isLeapYear
		? LEAP_YEAR_DAYS_IN_MONTH[month]
		: DAYS_IN_MONTH[month]

	const COLUMNS = 6
	const ROWS = 7
	const totalCells = COLUMNS * ROWS
	const cells: Array<number | null> = Array(totalCells).fill(null)

	for (let i = 0; i < daysInMonth; i++) {
		const index = i + firstDay
		if (index < totalCells) {
			cells[index] = i + 1
		}
	}

	return (
		<ThemedView style={[styles.container, { backgroundColor }]}>
			{cells.map((day, _index) => {
				const isBeforeCreation =
					isBeforeCreationMonth ||
					(day !== null && creationDay > 0 && day < creationDay)

				let cellBackgroundColor = "transparent"
				let cellTextColor = textColorOnGray
				let showText = false

				if (day !== null) {
					const isGreen = greens.includes(day)
					const isBlue = blues.includes(day)
					showText = true

					if (isGreen) {
						cellBackgroundColor = greenColor
						cellTextColor = textColorOnColored
					} else if (isBlue) {
						cellBackgroundColor = blueColor
						cellTextColor = textColorOnColored
					} else {
						cellBackgroundColor = `${grayColor}40`
						cellTextColor = textColorOnGray
					}
				}

				const opacity = isBeforeCreation ? 0.3 : 1

				return (
					<ThemedView
						key={day}
						style={[
							styles.cell,
							{ backgroundColor: cellBackgroundColor, opacity },
						]}
					>
						{showText && (
							<Text style={[styles.text, { color: cellTextColor }]}>{day}</Text>
						)}
					</ThemedView>
				)
			})}
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "column",
		flexWrap: "wrap",
		height: 7 * 18, // Increased from 14 to accommodate larger cells
		width: 6 * 18, // Increased from 14 to accommodate larger cells
	},
	cell: {
		width: 16, // Increased from 12
		height: 16, // Increased from 12
		margin: 1,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 3, // Slightly increased for better aesthetics with larger cells
	},
	text: {
		fontSize: 10, // Increased from 8 to be more readable in larger cells
	},
})

export default MonthComponent
