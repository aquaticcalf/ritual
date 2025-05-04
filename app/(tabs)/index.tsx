import React, { useEffect, useState, useRef } from "react";
import { FlatList, TouchableOpacity, StyleSheet, Animated, Pressable, Platform, Alert, View, ActivityIndicator } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDate, checkAndUpdateStreak, findLastScheduledDateBefore } from "@/lib/utils";
import { requestNotificationPermissions } from '@/lib/notifications';
import { Habit } from "@/lib/types";
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import WeekMap from '@/components/WeekMap';

const HomeScreen = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault');
  const iconColor = useThemeColor({}, 'icon');
  const buttonColor = useThemeColor({}, 'tint');
  const habitItemBackgroundColor = useThemeColor({}, 'card');
  const frozenHabitBackgroundColor = useThemeColor({}, 'frozenBackground'); // Ensure this exists in themes
  const frozenHabitBorderColor = useThemeColor({}, 'frozenBorder');     // Ensure this exists in themes
  const scaleAnimations = useRef<{[key: string]: Animated.Value}>({});

  // Define styles inside the component to access theme colors
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
    frozenHabit: {
      // Use the defined theme colors
      backgroundColor: frozenHabitBackgroundColor,
      borderLeftWidth: 4,
      borderLeftColor: frozenHabitBorderColor,
    },
  });

  interface HandleMarkAsDoneParams {
    id: string;
  }

  const handleMarkAsDone = async ({ id }: HandleMarkAsDoneParams): Promise<void> => {
    const habitIndex = habits.findIndex((h) => h.id === id);
    if (habitIndex === -1) return; // Habit not found

    // --- Preliminary Check: Re-validate habit state at the moment of marking ---
    const habitToCheck = habits[habitIndex];
    const today = new Date(); // Use current time for the check
    const validationResult = checkAndUpdateStreak(habitToCheck, today);
    let currentHabitState = validationResult.updatedHabit;
    let needsSaveAfterCheck = JSON.stringify(currentHabitState) !== JSON.stringify(habitToCheck);
    
    // --- Check if streak was broken during the check ---
    if (validationResult.streakBroken) {
        // Show toast that streak was lost before marking
        const originalFreezes = habitToCheck.freezesAvailable || 0;
        const finalFreezes = currentHabitState.freezesAvailable || 0;
        const attemptedToConsume = originalFreezes - finalFreezes;
        let toastText = `Streak reset for "${currentHabitState.name}".`;
        if(attemptedToConsume > 0) {
             toastText = `Used ${attemptedToConsume} freeze(s) for "${currentHabitState.name}", but more were needed.`
        } else {
             toastText = `Streak reset for "${currentHabitState.name}". No freezes were available.`
        }
        Toast.show({
            type: 'warn',
            text1: 'Streak Lost',
            text2: toastText,
            position: 'bottom'
        });
        // Note: We still allow marking it done for today, which will start a new streak of 1
    } else if (validationResult.freezesConsumed > 0) {
        // Show toast that streak was saved by freezes just before marking
        Toast.show({
            type: 'info',
            text1: 'Streak Saved!',
            text2: `${validationResult.freezesConsumed} freeze(s) used for "${currentHabitState.name}" just now.`, 
            position: 'bottom'
        });
    }
    // --- End of Preliminary Check ---

    const formattedToday = formatDate(today); // Use the same 'today' object
    const days = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    const dayIndex = today.getDay();
    const todayDayCode = days[dayIndex];

    // --- Handle Unmarking --- 
    // Unmarking logic remains largely the same, operates on currentHabitState
    if (currentHabitState.lastDone === formattedToday) {
      const unmarkHabit = () => {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        // Create a new object based on the validated state
        let unmarkedHabit = { ...currentHabitState };

        const streakBeforeDecrement = unmarkedHabit.currentStreak;
        unmarkedHabit.currentStreak = Math.max(0, unmarkedHabit.currentStreak - 1);

        if (streakBeforeDecrement > 0 &&
            streakBeforeDecrement % 5 === 0 &&
            unmarkedHabit.currentStreak === streakBeforeDecrement - 1)
        {
          console.log(`Habit "${unmarkedHabit.name}": Removing freeze granted at streak ${streakBeforeDecrement} due to unmarking.`);
          unmarkedHabit.freezesAvailable = Math.max(0, (unmarkedHabit.freezesAvailable || 0) - 1);
        }

        if (unmarkedHabit.prevBestStreak !== undefined) {
          unmarkedHabit.bestStreak = Math.max(unmarkedHabit.prevBestStreak, unmarkedHabit.currentStreak);
        }

        unmarkedHabit.heatMap = (unmarkedHabit.heatMap || []).filter(entry => entry.date !== formattedToday);
        const latestHeatmapDate = unmarkedHabit.heatMap.length > 0 ? unmarkedHabit.heatMap[unmarkedHabit.heatMap.length - 1].date : "";
        unmarkedHabit.lastDone = latestHeatmapDate;

        // Create the final habits array
        const finalHabits = habits.map((h, index) => index === habitIndex ? unmarkedHabit : h);

        setHabits(finalHabits);
        AsyncStorage.setItem("habits", JSON.stringify(finalHabits));

        Toast.show({
          type: 'success',
          text1: 'Habit unmarked',
          text2: `"${unmarkedHabit.name}" has been unmarked for today`,
          position: 'bottom'
        });
      };

      // Confirmation dialog (remains the same)
      if (Platform.OS === 'web') {
        if (window.confirm(`Do you want to unmark "${currentHabitState.name}" as done for today?`)) {
          unmarkHabit();
        }
      } else {
        Alert.alert(
          'Unmark Habit',
          `Do you want to unmark "${currentHabitState.name}" as done for today?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unmark', onPress: unmarkHabit }
          ]
        );
      }
      return; // Exit after handling unmark
    }

    // --- Handle Marking as Done (using validated state) --- 
    if (currentHabitState.frequency.includes(todayDayCode)) {
      
      // --- Perform Marking Logic on currentHabitState ---
      let markedHabit = { ...currentHabitState }; 

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // Animation logic (remains the same)
      if (!scaleAnimations.current[id]) { 
        scaleAnimations.current[id] = new Animated.Value(1); 
      }
      Animated.sequence([
          Animated.spring(scaleAnimations.current[id], { toValue: 1.05, friction: 3, tension: 40, useNativeDriver: true }),
          Animated.spring(scaleAnimations.current[id], { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
      ]).start();
      
      Toast.show({
        type: 'success',
        text1: 'Marked as done!',
        text2: `Great job completing "${markedHabit.name}" today!`, 
        position: 'bottom'
      });

      markedHabit.prevBestStreak = markedHabit.bestStreak;
      // Increment streak (will correctly become 1 if it was reset to 0 by the check)
      markedHabit.currentStreak += 1; 
      const newStreak = markedHabit.currentStreak;
      console.log(`Habit "${markedHabit.name}": Streak updated to ${newStreak}`);

      // Grant freeze?
      if (newStreak > 0 && newStreak % 5 === 0) {
        markedHabit.freezesAvailable = (markedHabit.freezesAvailable || 0) + 1;
        console.log(`Habit "${markedHabit.name}": Freeze granted! New total: ${markedHabit.freezesAvailable}`);
        Toast.show({
            type: 'info',
            text1: 'Freeze Earned!',
            text2: `You earned a freeze for "${markedHabit.name}"! Total: ${markedHabit.freezesAvailable}`,
            position: 'bottom'
        });
      }

      markedHabit.bestStreak = Math.max(markedHabit.bestStreak, newStreak);
      markedHabit.lastDone = formattedToday;

      // Update heatmap
      const heatMapEntryExists = (markedHabit.heatMap || []).some(entry => entry.date === formattedToday);
      if (!heatMapEntryExists) {
        markedHabit.heatMap = [...(markedHabit.heatMap || []), { day: todayDayCode, date: formattedToday }];
        markedHabit.heatMap.sort((a, b) => {
            const dateA = new Date(parseInt(a.date.split('/')[2]), parseInt(a.date.split('/')[1]) - 1, parseInt(a.date.split('/')[0]));
            const dateB = new Date(parseInt(b.date.split('/')[2]), parseInt(b.date.split('/')[1]) - 1, parseInt(b.date.split('/')[0]));
            return dateA.getTime() - dateB.getTime();
        });
      }

      // Remove freeze for today if present
      markedHabit.freezeMap = (markedHabit.freezeMap || []).filter(entry => entry.date !== formattedToday);
      // --- End of Marking Logic ---

      // Create the final habits array
      const finalHabits = habits.map((h, index) => index === habitIndex ? markedHabit : h);
      
      // Save and update state
      setHabits(finalHabits);
      await AsyncStorage.setItem("habits", JSON.stringify(finalHabits));

    } else { // Not scheduled for today
      Toast.show({
        type: 'error',
        text1: 'Not scheduled for today',
        text2: `"${currentHabitState.name}" is not scheduled for today`,
        position: 'bottom'
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      // If the preliminary check made changes, save them even if not scheduled
      if (needsSaveAfterCheck) {
          const finalHabits = habits.map((h, index) => index === habitIndex ? currentHabitState : h);
          await AsyncStorage.setItem("habits", JSON.stringify(finalHabits));
          setHabits(finalHabits); // Update UI to reflect potential streak break
      }
    }
  };

  useEffect(() => {
    const fetchAndCheckHabits = async () => {
      try {
        const existingHabitsJson = await AsyncStorage.getItem("habits");
        let habitsData: Habit[] = existingHabitsJson ? JSON.parse(existingHabitsJson) : [];

        const today = new Date();
        let habitsNeedSaving = false;
        let freezeMessages: { type: 'info' | 'warn', text1: string, text2: string }[] = [];

        // Ensure all habits have necessary arrays initialized
        habitsData = habitsData.map(h => ({
          ...h,
          heatMap: h.heatMap || [],
          freezeMap: h.freezeMap || [],
          freezesAvailable: h.freezesAvailable === undefined ? 0 : h.freezesAvailable,
        }));

        const processedHabitsPromises = habitsData.map(async (habit) => {
          const originalHabitState = JSON.stringify(habit); // For comparison later
          const result = checkAndUpdateStreak(habit, today);

          // Check if the core habit data changed
          if (JSON.stringify(result.updatedHabit) !== originalHabitState) {
             habitsNeedSaving = true;
          }
          
          // Generate Toast Messages based on the check result
          if (result.freezesConsumed > 0) {
            freezeMessages.push({
              type: 'info',
              text1: 'Streak Saved!',
              text2: `${result.freezesConsumed} freeze(s) used for "${result.updatedHabit.name}".`
            });
          } else if (result.streakBroken) {
            // Determine if freezes were available but insufficient
            const originalFreezes = habit.freezesAvailable || 0;
            const finalFreezes = result.updatedHabit.freezesAvailable || 0;
            const attemptedToConsume = originalFreezes - finalFreezes;

            if (attemptedToConsume > 0) { // Some freezes were used before breaking
              freezeMessages.push({
                type: 'warn',
                text1: 'Streak Lost',
                text2: `Used ${attemptedToConsume} freeze(s) for "${result.updatedHabit.name}", but more were needed.`
              });
            } else { // No freezes were available at all
               freezeMessages.push({
                  type: 'warn',
                  text1: 'Streak Lost',
                  text2: `Streak reset for "${result.updatedHabit.name}". No freezes were available.`
              });
            }
          }
          
          // Return the processed habit
          return result.updatedHabit;
        });
        
        const processedHabits = await Promise.all(processedHabitsPromises);

        if (habitsNeedSaving) {
          console.log("Habits updated after freeze/streak check, saving...");
          await AsyncStorage.setItem("habits", JSON.stringify(processedHabits));
        }

        setHabits(processedHabits);
        setIsLoading(false);

        // Show accumulated toast messages after setting state
        const uniqueMessages = new Map<string, { type: 'info' | 'warn', text1: string, text2: string }>();
        freezeMessages.forEach(msg => uniqueMessages.set(JSON.stringify(msg), msg));
        uniqueMessages.forEach(msg => {
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

  }, []); // Dependency array ensures it runs on mount

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText style={[styles.header, { color: textColor }]}>Ritual</ThemedText>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={buttonColor} />
          <ThemedText style={{ marginTop: 10, color: textColor }}>Loading habits...</ThemedText>
        </View>
      ) : habits.length === 0 ? (
        <ThemedText style={{ color: textColor, opacity: 0.5 }}>No habits yet, create a habit by clicking + button</ThemedText>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 5 }}
          renderItem={({ item }) => {
            if (!scaleAnimations.current[item.id]) {
              scaleAnimations.current[item.id] = new Animated.Value(1);
            }

            const today = new Date();
            const todayFormatted = formatDate(today);
            const isCompletedToday = item.lastDone === todayFormatted;

            // --- Updated Logic for isFrozenToday ---
            let isFrozenToday = false;
            const lastScheduledDate = findLastScheduledDateBefore(item.frequency, today);
            if (lastScheduledDate) {
              const isLastScheduledFrozen = (item.freezeMap || []).some(cell => cell.date === lastScheduledDate);
              // Frozen style applies if last scheduled day is frozen AND today isn't completed
              isFrozenToday = isLastScheduledFrozen && !isCompletedToday;
            }
            // --- End of Updated Logic ---

            return (
              <Animated.View style={{
                transform: [{ scale: scaleAnimations.current[item.id] }],
                marginBottom: 10,
                borderRadius: 10,
                overflow: 'visible',
                marginHorizontal: 3,
              }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.habitItem,
                    { backgroundColor: habitItemBackgroundColor },
                    // Apply frozen style first if applicable
                    isFrozenToday ? styles.frozenHabit : {},
                    // Apply completed style (potentially overrides frozen bg, but keeps border)
                    isCompletedToday ? styles.completedHabit : {},
                    // Apply opacity: highest priority is completion, then frozen, then press
                    isCompletedToday ? { opacity: 0.6 } :
                    (isFrozenToday ? { opacity: 0.8 } : 
                    (pressed ? { opacity: 0.7 } : {})),
                  ]}
                  onPress={() => router.push({ pathname: "/habit", params: { habit: JSON.stringify(item) } })}
                  onLongPress={() => handleMarkAsDone({ id: item.id })}
                  delayLongPress={500}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.habitDetailsContainer}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <ThemedText style={[{ color: iconColor }]}>
                          {item.icon}
                        </ThemedText>
                        <ThemedText style={[
                          { color: textColor, fontSize: 18 },
                          isCompletedToday ? styles.completedText : {}
                        ]}>
                          {item.name}
                        </ThemedText>
                        <ThemedText style={[{ color: secondaryTextColor, fontSize: 12 }]}>
                          {item.frequency.length === 7 ? "Every day" : `${item.frequency.length} days a week`}
                        </ThemedText>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <ThemedText style={[styles.streak, { color: textColor }]}>
                            {item.currentStreak} 🔥
                          </ThemedText>
                          {(item.freezesAvailable || 0) > 0 && (
                            <ThemedText style={[
                              styles.streak,
                              {
                                fontSize: 16,
                                color: '#4fc3f7', // Light blue for freeze icon
                                opacity: (isCompletedToday || isFrozenToday) ? 0.7 : 1 // Adjust opacity if frozen
                              }
                            ]}>
                              ❄️{item.freezesAvailable || 0}
                            </ThemedText>
                          )}
                      </View>
                    </View>
                    <WeekMap heatMap={item.heatMap || []} /> 
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

export default HomeScreen;