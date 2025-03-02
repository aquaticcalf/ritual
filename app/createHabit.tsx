import React, { useState, useEffect } from "react";
import {
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { FontAwesome } from "@expo/vector-icons";
import { EmojiPicker } from "@/components/EmojiPicker";
import TimePicker from "@/components/TimePicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";

const CreateHabitScreen = () => {
  const { habit } = useLocalSearchParams();
  const habitData = typeof habit === "string" ? JSON.parse(habit) : null;

  // Helper function to parse time string correctly
  interface ParsedTime {
    hours: number;
    minutes: number;
    period?: string;
  }

  const parseReminderTime = (timeStr: string): Date | undefined => {
    if (!timeStr) return undefined;

    try {
      // Extract hours and minutes regardless of format (12:30 PM or 12:30)
      const timeParts = timeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
      if (!timeParts) return new Date();

      let hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      const period = timeParts[3]?.toUpperCase();

      // Handle 12-hour format if AM/PM is present
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      date.setSeconds(0);
      return date;
    } catch (e) {
      console.error("Error parsing time:", e);
      return new Date();
    }
  };

  const [name, setName] = useState<string>(habitData?.name || "");
  const [icon, setIcon] = useState<string>(habitData?.icon || "");
  const [frequency, setFrequency] = useState<string[]>(habitData?.frequency || []);
  const [reminder, setReminder] = useState(habitData?.reminder || false);
  const [reminderTime, setReminderTime] = useState<Date | undefined>(
    habitData?.reminderTime ? parseReminderTime(habitData.reminderTime) : undefined
  );
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);

  const days = ["M", "T", "W", "Th", "F", "Sa", "S"];

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
    if (reminder && !reminderTime) {
      setReminderTime(new Date());
    }
  }, [reminder]);

  const handleCreateHabit = async () => {
    const newHabit = {
      id: Date.now().toString(),
      name,
      icon,
      frequency,
      reminder,
      reminderTime: reminder && reminderTime ? reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      currentStreak: 0,
      bestStreak: 0,
      lastDone: undefined,
      createdOn: new Date().toISOString()
    };

    try {
      const existingHabits = await AsyncStorage.getItem("habits");
      const habits = existingHabits ? JSON.parse(existingHabits) : [];
      habits.push(newHabit);
      await AsyncStorage.setItem("habits", JSON.stringify(habits));

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
      reminder,
      reminderTime: reminder && reminderTime ? reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    };

    try {
      const existingHabits = await AsyncStorage.getItem("habits");
      const habits = existingHabits ? JSON.parse(existingHabits) : [];
      const habitIndex = habits.findIndex((h: any) => h.id === habitData.id);
      if (habitIndex > -1) {
        habits[habitIndex] = updatedHabit;
        await AsyncStorage.setItem("habits", JSON.stringify(habits));
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
          <ThemedText style={[styles.label, { color: textColor }]}>Reminder</ThemedText>
          <Switch value={reminder} onValueChange={setReminder} />
        </ThemedView>

        {reminder && (
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