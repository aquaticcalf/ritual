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
import { FontAwesome } from "@expo/vector-icons";
import { EmojiPicker } from "@/components/EmojiPicker";
import TimePicker from "@/components/TimePicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { reloadHabitReminders, scheduleHabitReminder } from '@/lib/notifications';
import { Cell, Habit } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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

  const days = ["S", "M", "T", "W", "Th", "F", "Sa"];

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const inputBackgroundColor = useThemeColor({}, "card");
  const buttonColor = useThemeColor({}, "tint");
  const selectedDayColor = useThemeColor({}, "tint");
  const dayColor = useThemeColor({}, "icon");

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

  const handleCreateHabit = async () => {
    let heatMap: Array<Cell> = [];
    const iconToUse = !icon || icon === "" ? "🔥" : icon;

    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      icon: iconToUse, // Use the local variable instead of state
      frequency,
      reminder: isWeb ? false : reminder,  // Force reminders off on web
      reminderTime,
      currentStreak: 0,
      bestStreak: 0,
      lastDone: "",
      createdOn: new Date().toISOString(),
      heatMap
    };

    // Update the state for UI consistency (not needed for the habit object)
    if (!icon || icon === "") {
      setIcon("🔥");
    }

    console.log(newHabit);

    try {
      const existingHabits = await AsyncStorage.getItem("habits");
      const habits = existingHabits ? JSON.parse(existingHabits) : [];
      habits.push(newHabit);
      await AsyncStorage.setItem("habits", JSON.stringify(habits));

      // Only schedule reminders on non-web platforms
      if (!isWeb && newHabit.reminder && newHabit.reminderTime) {
        await scheduleHabitReminder(newHabit);
      }

      // Clear the form
      setName("");
      setIcon("");
      setFrequency([]);
      setReminder(false);
      setReminderTime(undefined);

      // Redirect to home screen
      router.push("/");

    } catch (error) {
      console.error("Error saving habit:", error);
    }
  };

  const handleEditHabit = async () => {
    if (!habitData) return;

    const updatedHabit = {
      ...habitData,
      name,
      icon,
      frequency,
      reminder: isWeb ? false : reminder,  // Force reminders off on web
      reminderTime,
    };

    try {
      const existingHabits = await AsyncStorage.getItem("habits");
      const habits = existingHabits ? JSON.parse(existingHabits) : [];
      const habitIndex = habits.findIndex((h: any) => h.id === habitData.id);
      if (habitIndex > -1) {
        habits[habitIndex] = updatedHabit;
        await AsyncStorage.setItem("habits", JSON.stringify(habits));
      }

      // Only reload reminders on non-web platforms
      if (!isWeb && updatedHabit.reminder && updatedHabit.reminderTime) {
        await reloadHabitReminders(habits);
      }

      // Redirect to home screen
      router.push("/");

    } catch (error) {
      console.error("Error updating habit:", error);
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
            placeholderTextColor={dayColor}
            value={name}
            onChangeText={setName}
          />
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: buttonColor }]}
            onPress={() => setIsEmojiPickerVisible(true)}
          >
            {icon ? (
              <ThemedText style={{ fontSize: 16 }}>{icon}</ThemedText>
            ) : (
              <FontAwesome name="plus" size={16} />
            )}
          </TouchableOpacity>
        </ThemedView>
        <ThemedText style={[styles.label, { color: textColor }]}>Frequency</ThemedText>
        <ThemedText style={[styles.subLabel, { color: dayColor }]}>Choose at least 1 day</ThemedText>
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
              <ThemedText style={[styles.dayText, { color: frequency.includes(day) ? backgroundColor : textColor }]}>{day}</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>

        <ThemedView style={styles.reminderContainer}>
          <ThemedView style={styles.reminderLabelContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Reminder</ThemedText>
            {isWeb && (
              <ThemedText style={styles.disclaimer}>*Not available on web</ThemedText>
            )}
          </ThemedView>
          <Switch 
            value={isWeb ? false : reminder} 
            onValueChange={setReminder}
            disabled={isWeb}
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
      </ScrollView>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: buttonColor }]}
        onPress={habitData ? handleEditHabit : handleCreateHabit}
      >
        <ThemedText
          style={[styles.createButtonText, { color: backgroundColor }]}
        >
          {habitData ? "Edit Habit" : "Create Habit"}
        </ThemedText>
      </TouchableOpacity>

      <EmojiPicker
        visible={isEmojiPickerVisible}
        onClose={() => setIsEmojiPickerVisible(false)}
        onSelect={(emoji) => setIcon(emoji)}
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