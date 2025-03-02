import React, { useEffect, useState } from "react";
import { FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Habit = {
  id: string;
  name: string;
  icon: string;
  frequency: string[];
  reminder: boolean;
  reminderTime?: string;
  currentStreak: number;
  bestStreak: number;
  noOfDaysDone: number;
  createdOn: string;
};

const HomeScreen = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const buttonColor = useThemeColor({}, 'tint');
  const habitItemBackgroundColor = useThemeColor({}, 'card');

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const existingHabits = await AsyncStorage.getItem("habits");
        const habits = existingHabits ? JSON.parse(existingHabits) : [];
        setHabits(habits);
      } catch (error) {
        console.error("Error fetching habits:", error);
      }
    };

    fetchHabits();
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
            >
              <ThemedText style={[styles.icon, { color: iconColor }]}>{item.icon}</ThemedText>
              <ThemedText style={[styles.habitText, { color: textColor }]}>{item.name}</ThemedText>
              <ThemedText style={[styles.streak, { color: textColor }]}>{item.currentStreak}🔥</ThemedText>
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