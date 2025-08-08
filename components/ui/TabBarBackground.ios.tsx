import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { BlurView } from "expo-blur"
import { StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useThemeColor } from "@/hooks/useThemeColor"

export default function BlurTabBarBackground() {
	const backgroundColor = useThemeColor({}, "card")

	return (
		<BlurView
			// Using dark material with lower intensity for more ritual-like feel
			tint={useThemeColor({}, "background") === "#221509" ? "dark" : "light"}
			intensity={80}
			style={[
				StyleSheet.absoluteFill,
				{ backgroundColor: `${backgroundColor}80` },
			]}
		/>
	)
}

export function useBottomTabOverflow() {
	const tabHeight = useBottomTabBarHeight()
	const { bottom } = useSafeAreaInsets()
	return tabHeight - bottom
}
