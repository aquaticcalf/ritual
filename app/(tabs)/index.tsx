import React, { useEffect, useState } from "react";
import { FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDate, isStreakAlive } from "@/lib/utils";
import { requestNotificationPermissions } from '@/lib/notifications';
import { Habit } from "@/lib/types";

const HomeScreen = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const buttonColor = useThemeColor({}, 'tint');
  const habitItemBackgroundColor = useThemeColor({}, 'card');

  interface HandleMarkAsDoneParams {
    id: string;
  }

  const handleMarkAsDone = async ({ id }: HandleMarkAsDoneParams): Promise<void> => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const today = new Date();
    const formatedToday = formatDate(today);
    if(habit.lastDone === formatedToday) return;
    const day = today.getDay();
    const days = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    if(habit.frequency.includes(days[day])) {
      if(isStreakAlive(habit.frequency, habit.lastDone)) {
        console.log('Streak is alive');
        const updatedHabits = habits.map((h) => {
          if (h.id === id) {
            h.currentStreak += 1;
            h.bestStreak = Math.max(h.bestStreak, h.currentStreak);
            h.lastDone = formatedToday;
            h.heatMap.push({ day: days[day], date: formatedToday });
          }
          return h;
        });
        setHabits(updatedHabits);
        await AsyncStorage.setItem("habits", JSON.stringify(updatedHabits));
      } else {
        console.log('Streak is dead');
        const updatedHabits = habits.map((h) => {
          if (h.id === id) {
            h.currentStreak = 1;
            h.bestStreak = Math.max(h.bestStreak, h.currentStreak);
            h.lastDone = formatedToday;
            h.heatMap.push({ day: days[day], date: formatedToday });
          }
          return h;
        });
        setHabits(updatedHabits);
        await AsyncStorage.setItem("habits", JSON.stringify(updatedHabits));
      }
    }
  };

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const existingHabits = await AsyncStorage.getItem("habits");
        const habits = existingHabits ? JSON.parse(existingHabits) : [];

        // Check if the streak is alive for each habit
        habits.forEach((habit: Habit) => {
          if (!isStreakAlive(habit.frequency, habit.lastDone)) {
            // update the streak to 0 if it's not alive
            habit.currentStreak = 0;
          }
        });

        // Save the updated habits
        await AsyncStorage.setItem("habits", JSON.stringify(habits));
        setHabits(habits);
      } catch (error) {
        console.error("Error fetching habits:", error);
      }
    };

    fetchHabits();
  }, []);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText style={[styles.header, { color: textColor }]}>Habits Streak</ThemedText>
      {habits.length === 0 ? (
        <ThemedText style={{ color: textColor, opacity: 0.5 }}>No habits yet, create a habit by clicking + button</ThemedText>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.habitItem, { backgroundColor: habitItemBackgroundColor }]}
              onPress={() => router.push({ pathname: "/habit", params: { habit: JSON.stringify(item) } })}
              onLongPress={() => handleMarkAsDone({ id: item.id })}
            >
              <ThemedText style={[styles.icon, { color: iconColor }]}>{item.icon}</ThemedText>
              <ThemedText style={[styles.habitText, { color: textColor }]}>{item.name}</ThemedText>
              <ThemedText style={[styles.streak, { color: textColor }]}>{item.currentStreak} 🔥</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}
      <TouchableOpacity style={[styles.addButton, { backgroundColor: buttonColor }]} onPress={() => router.push("/createHabit") }>
        <FontAwesome name="plus" size={24} color={backgroundColor} />
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  icon: {
    marginRight: 15,
  },
  habitText: {
    flex: 1,
    fontSize: 18,
  },
  streak: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
});

export default HomeScreen;