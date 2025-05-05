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
import { useThemeColor } from '@/hooks/useThemeColor';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/*
  1. Create the config
*/
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const backgroundColor = useThemeColor({}, 'background');

  const toastConfig = {
    success: (props: ToastShowParams) => (
      <BaseToast
        {...props}
        style={[
          { borderLeftColor: '#69C779' },
          colorScheme === 'dark' ? { backgroundColor: '#292524' } : { backgroundColor: '#F8F4EE' }
        ]}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 15,
          fontWeight: '400',
          color: colorScheme === 'dark' ? '#F5F5F4' : '#4A3B33'
        }}
        text2Style={{
          fontSize: 14,
          color: colorScheme === 'dark' ? '#A8A29E' : '#78716C'
        }}
      />
    ),
    error: (props: ToastShowParams) => (
      <ErrorToast
        {...props}
        style={[
          { borderLeftColor: '#DC2626' },
          colorScheme === 'dark' ? { backgroundColor: '#292524' } : { backgroundColor: '#F8F4EE' }
        ]}
        text1Style={{
          fontSize: 15,
          color: colorScheme === 'dark' ? '#F5F5F4' : '#4A3B33'
        }}
        text2Style={{
          fontSize: 14,
          color: colorScheme === 'dark' ? '#A8A29E' : '#78716C'
        }}
      />
    ),
    info: (props: ToastShowParams) => (
      <BaseToast
        {...props}
        style={[
          { borderLeftColor: '#4FC3F7' },
          colorScheme === 'dark' ? { backgroundColor: '#292524' } : { backgroundColor: '#F8F4EE' }
        ]}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 15,
          fontWeight: '400',
          color: colorScheme === 'dark' ? '#F5F5F4' : '#4A3B33'
        }}
        text2Style={{
          fontSize: 14,
          color: colorScheme === 'dark' ? '#A8A29E' : '#78716C'
        }}
      />
    ),
    warn: (props: ToastShowParams) => (
      <ErrorToast
        {...props}
        style={[
          { borderLeftColor: '#FFA726' },
          colorScheme === 'dark' ? { backgroundColor: '#292524' } : { backgroundColor: '#F8F4EE' }
        ]}
        text1Style={{
          fontSize: 15,
          color: colorScheme === 'dark' ? '#F5F5F4' : '#4A3B33'
        }}
        text2Style={{
          fontSize: 14,
          color: colorScheme === 'dark' ? '#A8A29E' : '#78716C'
        }}
      />
    )
  };

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
      <StatusBar style={colorScheme === 'light' ? 'dark' : 'light'} backgroundColor={backgroundColor} />
      <Toast config={toastConfig} />
    </ThemeProvider>
  );
}
