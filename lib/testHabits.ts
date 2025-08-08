import type { Cell, Habit } from "./types"
import { formatDate } from "./utils"

// Today is Tuesday, May 6, 2025
const TODAY = new Date(2025, 4, 6) // Month is 0-based, so 4 = May

// Helper to generate dates relative to today
function getDateString(daysAgo: number): string {
	const date = new Date(TODAY)
	date.setDate(TODAY.getDate() - daysAgo)
	return formatDate(date)
}

// Helper to create heat map entries for given dates
function createHeatMapEntries(
	dates: string[],
	dayMap: { [key: string]: string },
): Cell[] {
	return dates
		.map(date => ({
			day: dayMap[date] || "error",
			date,
		}))
		.sort((a, b) => {
			const dateA = new Date(
				Number.parseInt(a.date.split("/")[2]),
				Number.parseInt(a.date.split("/")[1]) - 1,
				Number.parseInt(a.date.split("/")[0]),
			)
			const dateB = new Date(
				Number.parseInt(b.date.split("/")[2]),
				Number.parseInt(b.date.split("/")[1]) - 1,
				Number.parseInt(b.date.split("/")[0]),
			)
			return dateA.getTime() - dateB.getTime()
		})
}

// Helper to get day code for a date
function getDayCode(date: Date): string {
	const dayIndex = date.getDay()
	return ["S", "M", "T", "W", "Th", "F", "Sa"][dayIndex]
}

// Helper to get next occurrence of a day code after a given date
function _getNextOccurrence(dayCode: string, afterDate: Date = TODAY): Date {
	const days = ["S", "M", "T", "W", "Th", "F", "Sa"]
	const targetDayIndex = days.indexOf(dayCode)
	const currentDayIndex = afterDate.getDay()
	let daysToAdd = targetDayIndex - currentDayIndex
	if (daysToAdd <= 0) daysToAdd += 7

	const nextDate = new Date(afterDate)
	nextDate.setDate(afterDate.getDate() + daysToAdd)
	return nextDate
}

// Helper to get previous occurrence of a day code before a given date
function _getPreviousOccurrence(
	dayCode: string,
	beforeDate: Date = TODAY,
): Date {
	const days = ["S", "M", "T", "W", "Th", "F", "Sa"]
	const targetDayIndex = days.indexOf(dayCode)
	const currentDayIndex = beforeDate.getDay()
	let daysToSubtract = currentDayIndex - targetDayIndex
	if (daysToSubtract <= 0) daysToSubtract += 7

	const prevDate = new Date(beforeDate)
	prevDate.setDate(beforeDate.getDate() - daysToSubtract)
	return prevDate
}

export function generateTestHabits(): Habit[] {
	const dayMap: { [key: string]: string } = {}

	// Pre-calculate last 30 days and their day codes for easier reference
	for (let i = 0; i < 30; i++) {
		const date = new Date(TODAY)
		date.setDate(TODAY.getDate() - i)
		dayMap[formatDate(date)] = getDayCode(date)
	}

	const habits: Habit[] = []

	// Habit 1: Daily Streak Test
	// Today is Tuesday, yesterday was Monday
	const habit1: Habit = {
		id: "test1",
		name: "Daily Streak Test",
		icon: "🎯",
		frequency: ["S", "M", "T", "W", "Th", "F", "Sa"],
		reminder: false,
		currentStreak: 4,
		bestStreak: 4,
		lastDone: getDateString(1), // Monday, May 5
		createdOn: new Date(2025, 4, 1).toISOString(), // Created May 1
		heatMap: createHeatMapEntries(
			[
				getDateString(4), // Friday, May 2
				getDateString(3), // Saturday, May 3
				getDateString(2), // Sunday, May 4
				getDateString(1), // Monday, May 5
			],
			dayMap,
		),
		freezeMap: [],
		freezesAvailable: 0,
	}
	habits.push(habit1)

	// Habit 2: Freeze Test
	// Scheduled Tue/Thu/Sat, Tests freeze consumption
	const habit2: Habit = {
		id: "test2",
		name: "Freeze Test",
		icon: "❄️",
		frequency: ["T", "Th", "Sa"],
		reminder: false,
		currentStreak: 10,
		bestStreak: 10,
		lastDone: getDateString(4), // Friday, May 2
		createdOn: new Date(2025, 3, 15).toISOString(), // Created April 15
		heatMap: createHeatMapEntries(
			[
				getDateString(10), // Wednesday, April 26
				getDateString(8), // Friday, April 28
				getDateString(6), // Sunday, April 30
				getDateString(4), // Friday, May 2
			],
			dayMap,
		),
		freezeMap: [],
		freezesAvailable: 2, // Should consume for Saturday, May 3
	}
	habits.push(habit2)

	// Habit 3: Frequency Change Test
	// Changed from Mon/Wed/Fri to Tue/Thu/Sat two days ago
	const habit3: Habit = {
		id: "test3",
		name: "Frequency Change Test",
		icon: "📅",
		frequency: ["T", "Th", "Sa"], // New frequency since Sunday
		reminder: false,
		currentStreak: 3,
		bestStreak: 5,
		lastDone: getDateString(2), // Sunday, May 4
		createdOn: new Date(2025, 4, 1).toISOString(), // Created May 1
		frequencyUpdatedDate: getDateString(2), // Changed Sunday, May 4
		heatMap: createHeatMapEntries(
			[
				getDateString(6), // Wednesday, April 30
				getDateString(4), // Friday, May 2
				getDateString(2), // Sunday, May 4
			],
			dayMap,
		),
		freezeMap: [],
		freezesAvailable: 0,
	}
	habits.push(habit3)

	// Habit 4: Streak Reset Test
	// Scheduled Sun/Tue/Thu, missed Sunday
	const habit4: Habit = {
		id: "test4",
		name: "Streak Reset Test",
		icon: "💔",
		frequency: ["S", "T", "Th"],
		reminder: false,
		currentStreak: 8,
		bestStreak: 8,
		prevBestStreak: 8,
		lastDone: getDateString(6), // Wednesday, April 30
		createdOn: new Date(2025, 3, 15).toISOString(), // Created April 15
		heatMap: createHeatMapEntries(
			[
				getDateString(12), // Thursday, April 24
				getDateString(10), // Saturday, April 26
				getDateString(8), // Monday, April 28
				getDateString(6), // Wednesday, April 30
			],
			dayMap,
		),
		freezeMap: [],
		freezesAvailable: 1, // Not enough for Sunday, May 4
	}
	habits.push(habit4)

	// Habit 5: Frozen State Test
	// Scheduled Mon/Thu, last Thursday is frozen
	const habit5: Habit = {
		id: "test5",
		name: "Frozen State Test",
		icon: "🧊",
		frequency: ["M", "Th"],
		reminder: false,
		currentStreak: 6,
		bestStreak: 6,
		lastDone: getDateString(7), // Tuesday, April 29
		createdOn: new Date(2025, 3, 15).toISOString(), // Created April 15
		heatMap: createHeatMapEntries(
			[
				getDateString(14), // Tuesday, April 22
				getDateString(10), // Saturday, April 26
				getDateString(7), // Tuesday, April 29
			],
			dayMap,
		),
		freezeMap: [
			{
				day: "Th",
				date: getDateString(5), // Thursday, May 1
			},
		],
		freezesAvailable: 1,
	}
	habits.push(habit5)

	// Habit 6: Frozen State After Freq Change
	// Changed from Mon/Wed/Fri to Tue/Thu/Sat, with Mon frozen
	const habit6: Habit = {
		id: "test6",
		name: "Frozen State After Freq Change",
		icon: "🌡️",
		frequency: ["T", "Th", "Sa"], // New frequency
		reminder: false,
		currentStreak: 5,
		bestStreak: 5,
		lastDone: getDateString(5), // Thursday, May 1
		createdOn: new Date(2025, 4, 1).toISOString(), // Created May 1
		frequencyUpdatedDate: getDateString(2), // Changed Sunday, May 4
		heatMap: createHeatMapEntries(
			[
				getDateString(9), // Sunday, April 27
				getDateString(7), // Tuesday, April 29
				getDateString(5), // Thursday, May 1
			],
			dayMap,
		),
		freezeMap: [
			{
				day: "M",
				date: getDateString(1), // Monday, May 5 (frozen)
			},
		],
		freezesAvailable: 0,
	}
	habits.push(habit6)

	return habits
}
