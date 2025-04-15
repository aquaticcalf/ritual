import { StyleSheet, Alert, TouchableOpacity, Switch, Platform, Modal, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { reloadHabitReminders, turnOffAllHabitReminders, turnOnAllHabitReminders } from '@/lib/notifications';
import { ThemePreference, getThemePreference, saveThemePreference } from '@/lib/themeManager';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

// Helper function to get display name for theme
const getThemeDisplayName = (themeValue: ThemePreference): string => {
  switch (themeValue) {
    case 'light': return 'Light';
    case 'dark': return 'Dark';
    case 'system': return 'System';
    default: return 'System';
  }
};

export default function Settings() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const buttonColor = useThemeColor({}, 'tint');
  const habitItemBackgroundColor = useThemeColor({}, 'card');
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault');

  const [theme, setTheme] = useState<ThemePreference>('system');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [themeModalVisible, setThemeModalVisible] = useState(false); // State for theme modal
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
    setThemeModalVisible(false); // Close modal after selection
    
    Toast.show({
      type: 'success',
      text1: 'Theme updated',
      text2: `App theme set to ${getThemeDisplayName(newTheme as ThemePreference)}`,
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
        <TouchableOpacity 
          style={[styles.settingItem, { backgroundColor: habitItemBackgroundColor }]}
          onPress={() => setThemeModalVisible(true)}
        >
          <ThemedText style={[styles.settingItemText, { color: textColor }]}>Select Theme</ThemedText>
          <View style={styles.valueContainer}>
            <ThemedText style={[styles.settingItemValue, { color: secondaryTextColor }]}>{getThemeDisplayName(theme)}</ThemedText>
            <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} style={styles.arrowIcon} />
          </View>
        </TouchableOpacity>
        <ThemedView style={[styles.notificationContainer, styles.settingItem, { backgroundColor: habitItemBackgroundColor, paddingVertical: 10 }]}>
          <ThemedText style={[styles.settingLabel, { color: textColor, marginTop: 0 }]}>Notifications</ThemedText>
          <Switch 
            value={notificationsEnabled} 
            onValueChange={handleToggleNotifications}
            disabled={isWeb} 
            trackColor={{ 
              false: secondaryTextColor + '40',
              true: buttonColor 
            }}
            thumbColor={notificationsEnabled ? buttonColor : habitItemBackgroundColor}
            ios_backgroundColor={secondaryTextColor + '40'}
          />
        </ThemedView>
        {isWeb && (
          <ThemedText style={[styles.disclaimer, { color: secondaryTextColor }]}>*Notifications are not available on web platforms</ThemedText>
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={themeModalVisible}
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: habitItemBackgroundColor }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Theme</ThemedText>
            {['system', 'light', 'dark'].map((themeOption, index, arr) => (
              <TouchableOpacity 
                key={themeOption}
                style={[
                  styles.modalOption, 
                  index < arr.length - 1 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: secondaryTextColor } : {}
                ]}
                onPress={() => handleThemeChange(themeOption)}
              >
                <ThemedText style={{ color: textColor, flex: 1 }}>{getThemeDisplayName(themeOption as ThemePreference)}</ThemedText>
                {theme === themeOption && <ThemedText style={{ color: buttonColor }}>✓</ThemedText>} 
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={[styles.modalCloseButton, { backgroundColor: secondaryTextColor + '20' }]}
              onPress={() => setThemeModalVisible(false)}
            >
              <ThemedText style={[styles.modalCloseButtonText, { color: textColor }]}>Close</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
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
    gap: 15,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 18,
    borderRadius: 10,
  },
  disclaimer: {
    fontSize: 12,
    opacity: 0.6,
    paddingHorizontal: 5,
  },
  notificationContainer: {
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingItemText: {
    flex: 1,
  },
  settingItemValue: {
    marginRight: 5,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 18,
    marginLeft: 3,
  },
});