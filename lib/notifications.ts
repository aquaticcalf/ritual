import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import type { Habit } from "./types"
import { formatDate } from "./utils"

const isWeb = Platform.OS === "web"

export async function requestNotificationPermissions() {
	if (isWeb) {
		return
	}

	const { status } = await Notifications.requestPermissionsAsync()
	if (status !== "granted") {
		alert("You need to enable notifications in settings")
	}
}

export async function reloadHabitReminders(habits: Habit[]) {
	if (isWeb) {
		return
	}

	const notifications = await Notifications.getAllScheduledNotificationsAsync()
	for (const notification of notifications) {
		if (notification.content.title === "Ritual") {
			await Notifications.cancelScheduledNotificationAsync(
				notification.identifier,
			)
		}
	}
	for (const habit of habits) {
		if (habit.reminder && habit.reminderTime) {
			await scheduleHabitReminder(habit)
		}
	}
}

export async function turnOffAllHabitReminders() {
	if (isWeb) {
		return
	}

	const notifications = await Notifications.getAllScheduledNotificationsAsync()
	for (const notification of notifications) {
		if (notification.content.title === "Ritual") {
			await Notifications.cancelScheduledNotificationAsync(
				notification.identifier,
			)
		}
	}
}

export async function turnOnAllHabitReminders(habits: Habit[]) {
	if (isWeb) {
		return
	}

	for (const habit of habits) {
		if (habit.reminder && habit.reminderTime) {
			await scheduleHabitReminder(habit)
		}
	}
}

export async function scheduleHabitReminder(habit: Habit) {
	if (isWeb) {
		return
	}

	if (!habit.reminder) {
		return
	}

	const days = ["S", "M", "T", "W", "Th", "F", "Sa"]
	if (!habit.reminderTime) {
		throw new Error("Reminder time is not defined")
	}
	const reminderTime = new Date(habit.reminderTime)
	const today = formatDate(new Date())

	if (habit.lastDone === today) {
		// Skip scheduling notification if the habit is already done today
		return
	}

	for (const day of habit.frequency) {
		const dayIndex = days.indexOf(day)
		const now = new Date()
		const nextReminder = new Date(now)
		nextReminder.setDate(now.getDate() + ((dayIndex + 7 - now.getDay()) % 7))
		nextReminder.setHours(reminderTime.getHours())
		nextReminder.setMinutes(reminderTime.getMinutes())
		nextReminder.setSeconds(0)
		nextReminder.setMilliseconds(0)

		await Notifications.scheduleNotificationAsync({
			content: {
				title: "Ritual",
				body: `Save your streak, Time to ${habit.name}`,
			},
			trigger: {
				type: Notifications.SchedulableTriggerInputTypes.DATE,
				date: nextReminder,
			},
		})
	}
}
