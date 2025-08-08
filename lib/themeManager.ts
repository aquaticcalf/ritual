import AsyncStorage from "@react-native-async-storage/async-storage"

export type ThemePreference = "light" | "dark" | "system"

export const saveThemePreference = async (theme: ThemePreference) => {
	try {
		await AsyncStorage.setItem("themePreference", theme)
		return true
	} catch (error) {
		console.error("Failed to save theme preference:", error)
		return false
	}
}

export const getThemePreference = async (): Promise<ThemePreference> => {
	try {
		const preference = await AsyncStorage.getItem("themePreference")
		return (preference as ThemePreference) || "system"
	} catch (error) {
		console.error("Failed to get theme preference:", error)
		return "system"
	}
}
