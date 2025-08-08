import { Tabs } from "expo-router"
import { Platform } from "react-native"

import { HapticTab } from "@/components/HapticTab"
import { IconSymbol } from "@/components/ui/IconSymbol"
import TabBarBackground from "@/components/ui/TabBarBackground"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"

export default function TabLayout() {
	const colorScheme = useColorScheme()

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						// Use a transparent background on iOS to show the blur effect
						position: "absolute",
						backgroundColor: `${Colors[colorScheme ?? "light"].background}80`,
						borderTopColor: Colors[colorScheme ?? "light"].border,
					},
					default: {
						backgroundColor: Colors[colorScheme ?? "light"].card,
						borderTopColor: Colors[colorScheme ?? "light"].border,
					},
				}),
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="house.fill" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="gear.full" color={color} />
					),
				}}
			/>
		</Tabs>
	)
}
