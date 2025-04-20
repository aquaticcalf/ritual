import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { ToastShowParams } from 'react-native-toast-message';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/*
  1. Create the config
*/
const toastConfig = {
  /*
    Overwrite 'success' type, modifying the existing BaseToast component
  */
  success: (props: ToastShowParams) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#69C779' }} // Example: Keep default green or customize
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '400'
      }}
    />
  ),
  /*
    Overwrite 'error' type, modifying the existing ErrorToast component
  */
  error: (props: ToastShowParams) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#FF6347' }} // Example: Keep default red or customize
      text1Style={{
        fontSize: 17
      }}
      text2Style={{
        fontSize: 15
      }}
    />
  ),
   /*
    Overwrite 'info' type, modifying the existing BaseToast component
  */
  info: (props: ToastShowParams) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#87CEFA' }} // Example: Light blue for info
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '400'
      }}
    />
  ),
  /*
    Define our custom 'warn' type
    Based on ErrorToast structure but with a warning color
  */
  warn: (props: ToastShowParams) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#FFA726' }} // Amber/Orange color for warnings
      text1Style={{
        fontSize: 17
      }}
      text2Style={{
        fontSize: 15
      }}
    />
  )
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="createHabit" options={{ title: 'Create Habit' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      <Toast config={toastConfig} />
    </ThemeProvider>
  );
}
