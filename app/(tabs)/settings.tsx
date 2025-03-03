import { StyleSheet, Alert, TouchableOpacity, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RadioButton } from 'react-native-paper';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { reloadHabitReminders, turnOffAllHabitReminders, turnOnAllHabitReminders } from '@/lib/notifications';

export default function Settings() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const buttonColor = useThemeColor({}, 'tint');
  const habitItemBackgroundColor = useThemeColor({}, 'card');

  const [theme, setTheme] = useState('system');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const fetchNotificationStatus = async () => {
      const storedHabits = await AsyncStorage.getItem('habits');
      const habits = storedHabits ? JSON.parse(storedHabits) : [];
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      setNotificationsEnabled(notifications.length > 0);
    };

    fetchNotificationStatus();
  }, []);

  const handleReloadReminders = async () => {
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
          <RadioButton.Group onValueChange={newValue => setTheme(newValue)} value={theme}>
            <ThemedView style={[styles.themeItem, { backgroundColor: habitItemBackgroundColor }]}>
              <ThemedText style={{ color: textColor }}>System</ThemedText>
              <RadioButton value="system" color={iconColor} />
            </ThemedView>
            <ThemedView style={[styles.themeItem, { backgroundColor: habitItemBackgroundColor }]}>
              <ThemedText style={{ color: textColor }}>Light</ThemedText>
              <RadioButton value="light" color={iconColor} />
            </ThemedView>
            <ThemedView style={[styles.themeItem, { backgroundColor: habitItemBackgroundColor }]}>
              <ThemedText style={{ color: textColor }}>Dark</ThemedText>
              <RadioButton value="dark" color={iconColor} />
            </ThemedView>
          </RadioButton.Group>
          <ThemedText style={styles.disclaimer}>*Theme setting is currently not working</ThemedText>
        </ThemedView>
        <ThemedView style={styles.notificationContainer}>
          <ThemedText style={[styles.settingLabel, { color: textColor }]}>Notifications</ThemedText>
          <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />
        </ThemedView>
        <TouchableOpacity style={[styles.button, { backgroundColor: buttonColor }]} onPress={handleReloadReminders}>
          <ThemedText style={[styles.buttonText, { color: backgroundColor } ]}>Reload Habit Reminders</ThemedText>
        </TouchableOpacity>
      </ThemedView>
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