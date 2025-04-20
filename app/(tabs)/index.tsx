import React, { useEffect, useState, useRef } from "react";
import { FlatList, TouchableOpacity, StyleSheet, Animated, Pressable, Platform, Alert, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDate, checkAndUpdateStreak } from "@/lib/utils";
import { requestNotificationPermissions } from '@/lib/notifications';
import { Habit } from "@/lib/types";
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import WeekMap from '@/components/WeekMap';

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
    // Find the most up-to-date habit state from the component's state
    const habitIndex = habits.findIndex((h) => h.id === id);
    if (habitIndex === -1) return;
    const habit = habits[habitIndex];

    const today = new Date();
    const formatedToday = formatDate(today);
    const days = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    const dayIndex = today.getDay();
    const todayDayCode = days[dayIndex];
    
    // --- Handle Unmarking --- 
    if(habit.lastDone === formatedToday) {
      const unmarkHabit = () => {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        
        const updatedHabits = habits.map((h) => {
          if (h.id === id) {
            const updatedHabit = { ...h }; // Work on a copy
            
            // Check if a freeze was potentially granted on this mark
            const streakBeforeDecrement = updatedHabit.currentStreak;
            updatedHabit.currentStreak = Math.max(0, updatedHabit.currentStreak - 1);
            
            // If decrementing caused a multiple of 5 boundary to be crossed downward,
            // and a freeze was granted for reaching that multiple, remove the freeze.
            if (streakBeforeDecrement > 0 && 
                streakBeforeDecrement % 5 === 0 && 
                updatedHabit.currentStreak === streakBeforeDecrement - 1) 
            {
              console.log(`Habit "${updatedHabit.name}": Removing freeze granted at streak ${streakBeforeDecrement} due to unmarking.`);
              updatedHabit.freezesAvailable = Math.max(0, (updatedHabit.freezesAvailable || 0) - 1);
            }

            // Restore previous best streak if available
            if (updatedHabit.prevBestStreak !== undefined) {
              updatedHabit.bestStreak = Math.max(updatedHabit.prevBestStreak, updatedHabit.currentStreak);
            }
            
            // Remove today's entry from heatMap
            updatedHabit.heatMap = updatedHabit.heatMap.filter(entry => entry.date !== formatedToday);
            
            // Update lastDone to the date of the new last entry, or empty if none
            updatedHabit.lastDone = updatedHabit.heatMap.length > 0 ? updatedHabit.heatMap[updatedHabit.heatMap.length - 1].date : "";
            
            return updatedHabit;
          }
          return h;
        });
        
        setHabits(updatedHabits);
        AsyncStorage.setItem("habits", JSON.stringify(updatedHabits));
        
        Toast.show({
          type: 'success',
          text1: 'Habit unmarked',
          text2: `"${habit.name}" has been unmarked for today`,
          position: 'bottom'
        });
      };
      
      // Confirmation Dialog (existing logic is fine)
      if (Platform.OS === 'web') {
        if (window.confirm(`Do you want to unmark "${habit.name}" as done for today?`)) {
          unmarkHabit();
        }
      } else {
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
    
    // --- Handle Marking as Done --- 
    // Check if today is a scheduled day
    if(habit.frequency.includes(todayDayCode)) {
      // Haptic feedback (existing logic is fine)
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Animation (existing logic is fine)
      if (!scaleAnimations.current[id]) {
        scaleAnimations.current[id] = new Animated.Value(1);
      }
      Animated.sequence([
          Animated.spring(scaleAnimations.current[id], { toValue: 1.05, friction: 3, tension: 40, useNativeDriver: true }),
          Animated.spring(scaleAnimations.current[id], { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
      ]).start();
      
      // Success Toast (existing logic is fine)
      Toast.show({
        type: 'success',
        text1: 'Marked as done!',
        text2: `Great job completing "${habit.name}" today!`, 
        position: 'bottom'
      });
      
      // Update habit state
      const updatedHabits = habits.map(h => {
        if (h.id === id) {
          const updatedHabit = { ...h };
          
          // Save previous best streak before updating
          updatedHabit.prevBestStreak = updatedHabit.bestStreak;
          
          // Increment current streak
          // The streak value is assumed correct from the useEffect check
          const oldStreak = updatedHabit.currentStreak;
          updatedHabit.currentStreak += 1;
          const newStreak = updatedHabit.currentStreak;

          console.log(`Habit "${updatedHabit.name}": Streak updated from ${oldStreak} to ${newStreak}`);
          
          // Grant freeze if new streak is a multiple of 5
          if (newStreak > 0 && newStreak % 5 === 0) {
            updatedHabit.freezesAvailable = (updatedHabit.freezesAvailable || 0) + 1;
            console.log(`Habit "${updatedHabit.name}": Freeze granted! New total: ${updatedHabit.freezesAvailable}`);
            // Optional: Show a toast for gaining a freeze
            Toast.show({
                type: 'info',
                text1: 'Freeze Earned!',
                text2: `You earned a freeze for "${updatedHabit.name}"! Total: ${updatedHabit.freezesAvailable}`,
                position: 'bottom'
            });
          }
          
          // Update best streak
          updatedHabit.bestStreak = Math.max(updatedHabit.bestStreak, newStreak);
          
          // Update last done date
          updatedHabit.lastDone = formatedToday;
          
          // Add to heatmap (ensure no duplicates for the same day)
          const heatMapEntryExists = updatedHabit.heatMap.some(entry => entry.date === formatedToday);
          if (!heatMapEntryExists) {
            updatedHabit.heatMap.push({ day: todayDayCode, date: formatedToday });
          }
          
          return updatedHabit;
        }
        return h;
      });
      
      setHabits(updatedHabits);
      await AsyncStorage.setItem("habits", JSON.stringify(updatedHabits));
      
    } else {
      // Not scheduled Toast (existing logic is fine)
      Toast.show({
        type: 'error',
        text1: 'Not scheduled for today',
        text2: `"${habit.name}" is not scheduled for today`,
        position: 'bottom'
      });
      
      // Haptic feedback (existing logic is fine)
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  useEffect(() => {
    const fetchAndCheckHabits = async () => {
      try {
        const existingHabitsJson = await AsyncStorage.getItem("habits");
        let habitsData: Habit[] = existingHabitsJson ? JSON.parse(existingHabitsJson) : [];

        const today = new Date();
        let habitsUpdated = false;
        let freezeMessages: { type: 'info' | 'warn', text1: string, text2: string }[] = [];

        // Check and update streak/freezes for each habit
        const processedHabits = habitsData.map(habit => {
          // Initialize freezesAvailable if it's missing (for backward compatibility)
          if (habit.freezesAvailable === undefined) {
            habit.freezesAvailable = 0;
          }
          
          const result = checkAndUpdateStreak(habit, today);
          if (JSON.stringify(result.updatedHabit) !== JSON.stringify(habit)) {
            habitsUpdated = true; // Mark if any habit was changed
            // Add toast messages based on freeze consumption/streak reset
            const originalHabit = habit; // Keep original for comparison
            const updatedHabit = result.updatedHabit;

            if (result.streakPreservedByFreeze) {
                const freezesUsed = (originalHabit.freezesAvailable || 0) - updatedHabit.freezesAvailable;
                if (freezesUsed > 0) {
                     freezeMessages.push({
                        type: 'info',
                        text1: 'Streak Saved!',
                        text2: `${freezesUsed} freeze(s) used for "${updatedHabit.name}".`
                    });
                }
            } else if (updatedHabit.currentStreak === 0 && originalHabit.currentStreak > 0) {
                 const freezesConsumed = (originalHabit.freezesAvailable || 0) - updatedHabit.freezesAvailable; // This will be originalHabit.freezesAvailable if reset happened
                if (freezesConsumed > 0) {
                     freezeMessages.push({
                        type: 'warn',
                        text1: 'Streak Lost',
                        text2: `Used ${freezesConsumed} freeze(s) for "${updatedHabit.name}", but more were needed.`
                    });
                } else {
                     freezeMessages.push({
                        type: 'warn',
                        text1: 'Streak Lost',
                        text2: `Streak reset for "${updatedHabit.name}". No freezes were available.`
                    });
                }
            }
          }
          return result.updatedHabit;
        });

        // Save the updated habits only if changes were made
        if (habitsUpdated) {
          console.log("Habits updated after freeze check, saving...");
          await AsyncStorage.setItem("habits", JSON.stringify(processedHabits));
        }
        
        setHabits(processedHabits);

        // Show accumulated toast messages after setting state
        freezeMessages.forEach(msg => {
            Toast.show({ ...msg, position: 'bottom' });
        });

      } catch (error) {
        console.error("Error fetching and checking habits:", error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Could not load or update habits.',
          position: 'bottom'
        });
      }
    };

    fetchAndCheckHabits();
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
                    // Apply reduced opacity if completed, otherwise apply press opacity
                    isCompletedToday ? { opacity: 0.6 } : (pressed ? { opacity: 0.7 } : {})
                  ]}
                  onPress={() => router.push({ pathname: "/habit", params: { habit: JSON.stringify(item) } })}
                  onLongPress={() => handleMarkAsDone({ id: item.id })}
                  delayLongPress={500} // Standard long press delay
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.habitDetailsContainer}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <ThemedText style={[
                              styles.streak,
                              { color: textColor }
                          ]}>{item.currentStreak} 🔥</ThemedText>
                          {/* Display freezes, potentially styled differently if streak is active but not done today */}
                          {item.freezesAvailable > 0 && (
                            <ThemedText style={[
                              styles.streak, 
                              {
                                fontSize: 16, 
                                // Use light blue if completed today or streak is 0, otherwise maybe a brighter/different blue?
                                // Let's try making it slightly less opaque if the habit is active but not done yet today
                                color: '#4fc3f7', 
                                opacity: (!isCompletedToday && item.currentStreak > 0) ? 1 : 0.7 
                              }
                            ]}>
                              ❄️{item.freezesAvailable}
                            </ThemedText>
                          )}
                      </View>
                    </View>
                    <WeekMap heatMap={item.heatMap} />
                  </View>
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
    alignItems: "stretch",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  habitDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
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