import { StyleSheet, Alert, TouchableOpacity, Switch, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RadioButton } from 'react-native-paper';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { reloadHabitReminders, turnOffAllHabitReminders, turnOnAllHabitReminders } from '@/lib/notifications';
import { ThemePreference, getThemePreference, saveThemePreference } from '@/lib/themeManager';
import Toast from 'react-native-toast-message';

export default function Settings() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const buttonColor = useThemeColor({}, 'tint');
  const habitItemBackgroundColor = useThemeColor({}, 'card');

  const [theme, setTheme] = useState<ThemePreference>('system');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    // Load saved theme preference
    const loadTheme = async () => {
      const savedTheme = await getThemePreference();
      setTheme(savedTheme);
    };
    
    loadTheme();
  }, []);

  useEffect(() => {
    const fetchNotificationStatus = async () => {
      try {
        if (isWeb) {
          // Web platforms don't support notifications, default to false
          setNotificationsEnabled(false);
          return;
        }
        
        const storedHabits = await AsyncStorage.getItem('habits');
        const habits = storedHabits ? JSON.parse(storedHabits) : [];
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        setNotificationsEnabled(notifications.length > 0);
      } catch (error) {
        console.error('Failed to fetch notification status:', error);
        setNotificationsEnabled(false);
      }
    };

    fetchNotificationStatus();
  }, [isWeb]);

  const handleThemeChange = async (newTheme: string) => {
    await saveThemePreference(newTheme as ThemePreference);
    setTheme(newTheme as ThemePreference);
    
    Toast.show({
      type: 'success',
      text1: 'Theme updated',
      text2: `App theme set to ${newTheme}`,
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const handleReloadReminders = async () => {
    if (isWeb) {
      Alert.alert('Not Available', 'Notifications are not available on web platforms');
      return;
    }

    try {
      const storedHabits = await AsyncStorage.getItem('habits');
      const habits = storedHabits ? JSON.parse(storedHabits) : [];
      await reloadHabitReminders(habits);
      Alert.alert('Success', 'Habit reminders reloaded successfully');
    } catch (error) {
      console.error('Failed to reload habit reminders:', error);
      Alert.alert('Error', 'Failed to reload habit reminders');
    }
  };

  const handleToggleNotifications = async () => {
    if (isWeb) {
      Alert.alert('Not Available', 'Notifications are not available on web platforms');
      return;
    }

    try {
      const storedHabits = await AsyncStorage.getItem('habits');
      const habits = storedHabits ? JSON.parse(storedHabits) : [];
      if (notificationsEnabled) {
        await turnOffAllHabitReminders();
      } else {
        await turnOnAllHabitReminders(habits);
      }
      setNotificationsEnabled(!notificationsEnabled);
    } catch (error) {
      console.error('Failed to toggle habit reminders:', error);
      Alert.alert('Error', 'Failed to toggle habit reminders');
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText style={[styles.header, { color: textColor }]}>Settings</ThemedText>
      <ThemedView style={styles.settingsContainer}>
        <ThemedText style={[styles.settingLabel, { color: textColor }]}>Theme</ThemedText>
        <ThemedView style={[styles.themeContainer, { backgroundColor: habitItemBackgroundColor }]}>
          <RadioButton.Group onValueChange={handleThemeChange} value={theme}>
            <TouchableOpacity 
              onPress={() => handleThemeChange('system')}
              style={[styles.themeItem, { backgroundColor: habitItemBackgroundColor }]}
            >
              <ThemedText style={{ color: textColor }}>System</ThemedText>
              <RadioButton value="system" color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleThemeChange('light')}
              style={[styles.themeItem, { backgroundColor: habitItemBackgroundColor }]}
            >
              <ThemedText style={{ color: textColor }}>Light</ThemedText>
              <RadioButton value="light" color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleThemeChange('dark')}
              style={[styles.themeItem, { backgroundColor: habitItemBackgroundColor }]}
            >
              <ThemedText style={{ color: textColor }}>Dark</ThemedText>
              <RadioButton value="dark" color={iconColor} />
            </TouchableOpacity>
          </RadioButton.Group>
        </ThemedView>
        <ThemedView style={styles.notificationContainer}>
          <ThemedText style={[styles.settingLabel, { color: textColor }]}>Notifications</ThemedText>
          <Switch 
            value={notificationsEnabled} 
            onValueChange={handleToggleNotifications}
            disabled={isWeb} 
          />
        </ThemedView>
        {isWeb && (
          <ThemedText style={styles.disclaimer}>*Notifications are not available on web platforms</ThemedText>
        )}
        <TouchableOpacity 
          style={[styles.button, { 
            backgroundColor: buttonColor,
            opacity: isWeb ? 0.5 : 1 
          }]} 
          onPress={handleReloadReminders}
          disabled={isWeb}
        >
          <ThemedText style={[styles.buttonText, { color: backgroundColor }]}>
            Reload Habit Reminders
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <Toast />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,  
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
  },
  settingsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  settingLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  themeContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  themeItem: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  disclaimer: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.5,
  },
  notificationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});