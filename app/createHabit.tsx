import React, { useState, useEffect } from "react";
import {
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { MaterialIcons } from "@expo/vector-icons";
import { EmojiPicker } from "@/components/EmojiPicker";
import TimePicker from "@/components/TimePicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { reloadHabitReminders, scheduleHabitReminder } from '@/lib/notifications';
import { Cell, Habit } from "@/lib/types";
import Toast from 'react-native-toast-message'; // Make sure this import is present
import { generateHistoricalHeatMap } from "@/lib/utils";
import { AdvancedOptions } from "@/components/AdvancedOptions";

const CreateHabitScreen = () => {
  const { habit } = useLocalSearchParams();
  const habitData = typeof habit === "string" ? JSON.parse(habit) : null;
  const isWeb = Platform.OS === 'web';

  const [name, setName] = useState<string>(habitData?.name || "");
  const [icon, setIcon] = useState<string>(habitData?.icon || "");
  const [frequency, setFrequency] = useState<string[]>(habitData?.frequency || []);
  const [reminder, setReminder] = useState(habitData?.reminder || false);
  const [reminderTime, setReminderTime] = useState<Date | undefined>(habitData?.reminderTime ? new Date(habitData.reminderTime) : undefined);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [initialStreak, setInitialStreak] = useState(0);

  const days = ["S", "M", "T", "W", "Th", "F", "Sa"];

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const inputBackgroundColor = useThemeColor({}, "card");
  const buttonColor = useThemeColor({}, "tint");
  const selectedDayColor = useThemeColor({}, "tint");
  const secondaryTextColor = useThemeColor({}, "tabIconDefault");

  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: habitData ? "Edit Habit" : "Create Habit" });
  }, [habitData]);

  useEffect(() => {
    if (reminder && !reminderTime && !isWeb) {
      setReminderTime(new Date());
    }
  }, [reminder]);

  // Validation helper function
  const validateForm = () => {
    // Check if name is empty
    if (!name || name.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Name is required',
        text2: 'Please enter a name for your habit',
        position: 'bottom',
        visibilityTime: 3000,
      });
      return false;
    }

    // Check if frequency is empty
    if (frequency.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Frequency is required',
        text2: 'Please select at least one day for your habit',
        position: 'bottom',
        visibilityTime: 3000,
      });
      return false;
    }

    // Check if reminder is enabled but no time selected
    if (reminder && !reminderTime && !isWeb) {
      Toast.show({
        type: 'error',
        text1: 'Reminder time missing',
        text2: 'Please set a time for your reminder',
        position: 'bottom',
        visibilityTime: 3000,
      });
      return false;
    }

    // Check if initial streak is valid (non-negative integer within allowed range)
    if (initialStreak < 0 || !Number.isInteger(Number(initialStreak)) || initialStreak > 10) {
      let errorMessage = 'Please enter a non-negative whole number';
      
      if (initialStreak > 10) {
        errorMessage = 'Maximum allowed initial streak is 10';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Invalid streak value',
        text2: errorMessage,
        position: 'bottom',
        visibilityTime: 3000,
      });
      return false;
    }

    return true;
  };

  const handleCreateHabit = async () => {
    // Validate the form
    if (!validateForm()) {
      return;
    }

    const iconToUse = !icon || icon === "" ? "local-fire-department" : icon;

    // Generate historical data if initialStreak > 0
    const historicalData = initialStreak > 0 
      ? generateHistoricalHeatMap(initialStreak, frequency)
      : {heatMap: [], lastDone: "", createdOnDate: new Date().toISOString()};

    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      icon: iconToUse,
      frequency,
      reminder: isWeb ? false : reminder,
      reminderTime,
      currentStreak: initialStreak,
      bestStreak: initialStreak,
      prevBestStreak: Math.max(0, initialStreak - 1),
      lastDone: historicalData.lastDone,
      createdOn: historicalData.createdOnDate,
      heatMap: historicalData.heatMap,
      freezeMap: [],
      freezesAvailable: 0
    };

    // Update the state for UI consistency (not needed for the habit object)
    if (!icon || icon === "") {
      setIcon("local-fire-department");
    }

    try {
      const existingHabits = await AsyncStorage.getItem("habits");
      const habits = existingHabits ? JSON.parse(existingHabits) : [];
      habits.push(newHabit);
      await AsyncStorage.setItem("habits", JSON.stringify(habits));

      // Only schedule reminders on non-web platforms
      if (!isWeb && newHabit.reminder && newHabit.reminderTime) {
        await scheduleHabitReminder(newHabit);
      }

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Habit created',
        text2: `${name} has been added to your habits`,
        position: 'bottom',
        visibilityTime: 2000,
      });

      // Clear the form
      setName("");
      setIcon("");
      setFrequency([]);
      setReminder(false);
      setReminderTime(undefined);

      // Redirect to home screen
      setTimeout(() => {
        router.push("/");
      }, 1000);

    } catch (error) {
      console.error("Error saving habit:", error);
      Toast.show({
        type: 'error',
        text1: 'Failed to save habit',
        text2: 'Please try again',
        position: 'bottom',
      });
    }
  };

  const handleEditHabit = async () => {
    if (!habitData) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Habit data missing',
        position: 'bottom',
      });
      return;
    }

    // Validate the form
    if (!validateForm()) {
      return;
    }

    // Check if frequency has changed
    const frequencyChanged = JSON.stringify(habitData.frequency) !== JSON.stringify(frequency);
    
    const updatedHabit = {
      ...habitData,
      name,
      icon,
      frequency,
      reminder: isWeb ? false : reminder,  // Force reminders off on web
      reminderTime,
      // If frequency changed, update the frequencyUpdatedDate
      ...(frequencyChanged && { frequencyUpdatedDate: new Date().toISOString() })
    };

    try {
      const existingHabits = await AsyncStorage.getItem("habits");
      const habits = existingHabits ? JSON.parse(existingHabits) : [];
      const habitIndex = habits.findIndex((h: any) => h.id === habitData.id);
      
      if (habitIndex > -1) {
        habits[habitIndex] = updatedHabit;
        await AsyncStorage.setItem("habits", JSON.stringify(habits));
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to update habit',
          text2: 'Habit not found in storage',
          position: 'bottom',
        });
        return;
      }

      // Only reload reminders on non-web platforms
      if (!isWeb && updatedHabit.reminder && updatedHabit.reminderTime) {
        await reloadHabitReminders(habits);
      }

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Habit updated',
        text2: `${name} has been updated successfully`,
        position: 'bottom',
        visibilityTime: 2000,
      });

      // Redirect to home screen
      setTimeout(() => {
        router.push("/");
      }, 1000);

    } catch (error) {
      console.error("Error updating habit:", error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update habit',
        text2: 'Please try again',
        position: 'bottom',
      });
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Name</ThemedText>
        <ThemedView style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              { color: textColor, backgroundColor: inputBackgroundColor },
            ]}
            placeholder="Workout"
            placeholderTextColor={secondaryTextColor}
            value={name}
            onChangeText={setName}
          />
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: buttonColor }]}
            onPress={() => setIsEmojiPickerVisible(true)}
          >
            {icon ? (
              <MaterialIcons name={icon as any} size={24} color={backgroundColor} />
            ) : (
              <MaterialIcons name="add" size={24} color={backgroundColor} />
            )}
          </TouchableOpacity>
        </ThemedView>
        <ThemedText style={[styles.label, { color: textColor }]}>Frequency</ThemedText>
        <ThemedText style={[styles.subLabel, { color: secondaryTextColor }]}>Choose at least 1 day</ThemedText>
        <ThemedView style={styles.dayContainer}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.day, frequency.includes(day) ? { backgroundColor: selectedDayColor } : { backgroundColor: inputBackgroundColor }]}
              onPress={() => {
                setFrequency((prev) =>
                  prev.includes(day)
                    ? prev.filter((d) => d !== day)
                    : [...prev, day]
                );
              }}
            >
              <ThemedText style={[styles.dayText, { color: frequency.includes(day) ? backgroundColor : secondaryTextColor }]}>{day}</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>

        <ThemedView style={styles.reminderContainer}>
          <ThemedView style={styles.reminderLabelContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Reminder</ThemedText>
            {isWeb && (
              <ThemedText style={[styles.disclaimer, { color: secondaryTextColor }]}>*Not available on web</ThemedText>
            )}
          </ThemedView>
          <Switch 
            value={isWeb ? false : reminder} 
            onValueChange={setReminder}
            disabled={isWeb}
            trackColor={{ 
              false: secondaryTextColor + '40',
              true: buttonColor 
            }}
            thumbColor={inputBackgroundColor}
            ios_backgroundColor={secondaryTextColor + '40'}
          />
        </ThemedView>

        {reminder && !isWeb && (
          <TimePicker
            isEditing={!!habitData}
            time={reminderTime || new Date()}
            onTimeChange={(selectedTime) => {
              if (selectedTime) {
                setReminderTime(selectedTime);
              }
            }}
          />
        )}
        
        {/* Advanced Options - Only show in create mode */}
        {!habitData && (
          <AdvancedOptions
            showAdvancedOptions={showAdvancedOptions}
            setShowAdvancedOptions={setShowAdvancedOptions}
            initialStreak={initialStreak}
            setInitialStreak={setInitialStreak}
            backgroundColor={backgroundColor}
            textColor={textColor}
            inputBackgroundColor={inputBackgroundColor}
            buttonColor={buttonColor}
            dayColor={secondaryTextColor}
          />
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: buttonColor }]}
        onPress={habitData ? handleEditHabit : handleCreateHabit}
      >
        <ThemedText
          style={[styles.createButtonText, { color: backgroundColor }]}
        >
          {habitData ? "Update Habit" : "Create Habit"}
        </ThemedText>
      </TouchableOpacity>

      <EmojiPicker
        visible={isEmojiPickerVisible}
        onClose={() => setIsEmojiPickerVisible(false)}
        onSelect={(selectedIcon) => setIcon(selectedIcon)}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  subLabel: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    borderRadius: 10,
    outline: "none",
  },
  iconButton: {
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 16,
  },
  reminderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  reminderLabelContainer: {
    flexDirection: "column",
  },
  disclaimer: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.5,
  },
  createButton: {
    padding: 15,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CreateHabitScreen;