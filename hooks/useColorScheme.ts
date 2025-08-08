import { useEffect, useState } from "react"
import { useColorScheme as useDeviceColorScheme } from "react-native"
import { getThemePreference } from "@/lib/themeManager"

export function useColorScheme() {
	const deviceColorScheme = useDeviceColorScheme()
	const [themePreference, setThemePreference] = useState<string | null>(null)

	useEffect(() => {
		const loadTheme = async () => {
			const savedTheme = await getThemePreference()
			setThemePreference(savedTheme)
		}

		loadTheme()

		// Listen for theme preference changes
		const intervalId = setInterval(loadTheme, 1000)
		return () => clearInterval(intervalId)
	}, [])

	if (themePreference === "light") return "light"
	if (themePreference === "dark") return "dark"

	return deviceColorScheme || "light"
}
