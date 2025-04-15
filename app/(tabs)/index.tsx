import React, { useEffect, useState, useRef } from "react";
import { FlatList, TouchableOpacity, StyleSheet, Animated, Pressable, Platform, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDate, isStreakAlive } from "@/lib/utils";
import { requestNotificationPermissions } from '@/lib/notifications';
import { Habit } from "@/lib/types";
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

const HomeScreen = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault');
  const iconColor = useThemeColor({}, 'icon');
  const buttonColor = useThemeColor({}, 'tint');
  const habitItemBackgroundColor = useThemeColor({}, 'card');
  const scaleAnimations = useRef<{[key: string]: Animated.Value}>({});

  interface HandleMarkAsDoneParams {
    id: string;
  }

  const handleMarkAsDone = async ({ id }: HandleMarkAsDoneParams): Promise<void> => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const today = new Date();
    const formatedToday = formatDate(today);
    
    // If the habit is already marked as done today, ask if user wants to unmark it
    if(habit.lastDone === formatedToday) {
      // Create confirmation dialog based on platform
      const unmarkHabit = () => {
        // Provide haptic feedback for unmarking
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        
        const updatedHabits = habits.map((h) => {
          if (h.id === id) {
            // Decrease streak by 1
            h.currentStreak = Math.max(0, h.currentStreak - 1);
            
            // Restore previous best streak if available
            if (h.prevBestStreak !== undefined) {
              h.bestStreak = Math.max(h.prevBestStreak, h.currentStreak);
            }
            
            // Remove the last entry from heatMap (today's entry)
            const newHeatMap = [...h.heatMap];
            newHeatMap.pop();
            h.heatMap = newHeatMap;
            
            // Update lastDone to the date of the new last entry in heatMap, or empty if no entries
            h.lastDone = newHeatMap.length > 0 ? newHeatMap[newHeatMap.length - 1].date : "";
          }
          return h;
        });
        
        // Update state and storage
        setHabits(updatedHabits);
        AsyncStorage.setItem("habits", JSON.stringify(updatedHabits));
        
        // Show success toast for unmarking
        Toast.show({
          type: 'success',
          text1: 'Habit unmarked',
          text2: `"${habit.name}" has been unmarked for today`,
          position: 'bottom'
        });
      };
      
      if (Platform.OS === 'web') {
        // For web, use browser's confirm dialog
        if (window.confirm(`Do you want to unmark "${habit.name}" as done for today?`)) {
          unmarkHabit();
        }
      } else {
        // For mobile, use React Native Alert
        Alert.alert(
          'Unmark Habit',
          `Do you want to unmark "${habit.name}" as done for today?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unmark', onPress: unmarkHabit }
          ]
        );
      }
      return;
    }
    
    const day = today.getDay();
    const days = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    
    if(habit.frequency.includes(days[day])) {
      // Provide haptic feedback only on native platforms
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Get or create the animation value for this habit
      if (!scaleAnimations.current[id]) {
        scaleAnimations.current[id] = new Animated.Value(1);
      }
      
      // Animate scale up
      Animated.sequence([
        Animated.spring(scaleAnimations.current[id], {
          toValue: 1.05,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimations.current[id], {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Marked as done!',
        text2: `Great job completing "${habit.name}" today!`,
        position: 'bottom'
      });
      
      if(isStreakAlive(habit.frequency, habit.lastDone)) {
        console.log('Streak is alive');
        const updatedHabits = habits.map((h) => {
          if (h.id === id) {
            // Save the previous best streak before updating
            h.prevBestStreak = h.bestStreak;
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
            // Save the previous best streak before updating
            h.prevBestStreak = h.bestStreak;
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
    } else {
      // Show error toast when trying to mark a habit as done on an unscheduled day
      Toast.show({
        type: 'error',
        text1: 'Not scheduled for today',
        text2: `"${habit.name}" is not scheduled for today`,
        position: 'bottom'
      });
      
      // Only trigger haptic feedback on native platforms
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
          contentContainerStyle={{ paddingHorizontal: 5 }} // Add horizontal padding to FlatList content
          renderItem={({ item }) => {
            // Create animation value for this item if it doesn't exist
            if (!scaleAnimations.current[item.id]) {
              scaleAnimations.current[item.id] = new Animated.Value(1);
            }
            
            // Check if habit is done today
            const today = formatDate(new Date());
            const isCompletedToday = item.lastDone === today;
            
            return (
              <Animated.View style={{
                transform: [{ scale: scaleAnimations.current[item.id] }],
                marginBottom: 10,
                borderRadius: 10,
                overflow: 'visible', // Allow content to overflow container bounds
                // Add small horizontal margin to give room for scaling
                marginHorizontal: 3,
              }}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.habitItem,
                    { backgroundColor: habitItemBackgroundColor },
                    // Apply completed habit style if done today
                    isCompletedToday ? styles.completedHabit : {},
                    // Only apply opacity when it's a regular press, not during long press
                    pressed ? { opacity: 0.7 } : {}
                  ]}
                  onPress={() => router.push({ pathname: "/habit", params: { habit: JSON.stringify(item) } })}
                  onLongPress={() => handleMarkAsDone({ id: item.id })}
                  delayLongPress={500} // Standard long press delay
                >
                  <ThemedView style={{ flexDirection: "row", alignItems: "center", backgroundColor: habitItemBackgroundColor, gap: 10 }}>
                    <ThemedText style={[
                      { color: iconColor }
                    ]}>{item.icon}</ThemedText>
                    <ThemedText style={[
                      { color: textColor, fontSize: 18 },
                      // Apply text strikethrough if completed today
                      isCompletedToday ? styles.completedText : {}
                    ]}>{item.name}</ThemedText>
                    {/* if frequency size is 7, then show every day else show the length of frequency days a week example: 3 days a week */}
                    <ThemedText style={[
                      { color: secondaryTextColor, fontSize: 12 }
                    ]}>{item.frequency.length === 7 ? "Every day" : `${item.frequency.length} days a week`}</ThemedText>
                  </ThemedView>
                  <ThemedText style={[
                    styles.streak, 
                    { color: textColor }
                  ]}>{item.currentStreak} 🔥</ThemedText>
                </Pressable>
              </Animated.View>
            );
          }}
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
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
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
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  completedHabit: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50', // Green success color
  },
});

export default HomeScreen;