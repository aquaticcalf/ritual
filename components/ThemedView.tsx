import { LinearGradient } from "expo-linear-gradient"
import { View, type ViewProps } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useThemeColor } from "@/hooks/useThemeColor"

export type ThemedViewProps = ViewProps & {
	lightColor?: string
	darkColor?: string
	useGradient?: boolean
}

export function ThemedView({
	style,
	lightColor,
	darkColor,
	useGradient = false,
	...otherProps
}: ThemedViewProps) {
	const backgroundColor = useThemeColor(
		{ light: lightColor, dark: darkColor },
		"background",
	)
	const _colorScheme = useColorScheme()
	const startColor = useThemeColor({}, "gradientStart")
	const endColor = useThemeColor({}, "gradientEnd")

	if (useGradient) {
		return (
			<LinearGradient
				colors={[startColor, endColor]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={[{ backgroundColor }, style]}
				{...otherProps}
			/>
		)
	}

	return <View style={[{ backgroundColor }, style]} {...otherProps} />
}
