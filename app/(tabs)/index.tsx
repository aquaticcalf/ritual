import React, { useEffect, useState, useRef, useCallback } from "react";
import { FlatList, TouchableOpacity, StyleSheet, Animated, Pressable, Platform, Alert, View, ActivityIndicator, RefreshControl, ScrollView, useColorScheme } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
import { CustomAlert } from '@/components/CustomAlert';
import { Tooltip } from '@/components/Tooltip';

const HomeScreen = () => {
  const colorScheme = useColorScheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUnmarkAlert, setShowUnmarkAlert] = useState(false);
  const [habitToUnmark, setHabitToUnmark] = useState<string | null>(null);
  const [unmarkFunction, setUnmarkFunction] = useState<(() => void) | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
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
  const infoButtonRef = useRef<View>(null);

  // Define styles inside the component to access theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 15,
      paddingTop: 15,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingTop: 20,
      paddingBottom: 10,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
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
            position: 'bottom',
            visibilityTime: 3000,
        });
        // Note: We still allow marking it done for today, which will start a new streak of 1
    } else if (validationResult.freezesConsumed > 0) {
        // Show toast that streak was saved by freezes just before marking
        Toast.show({
            type: 'info',
            text1: 'Streak Saved!',
            text2: `${validationResult.freezesConsumed} freeze(s) used for "${currentHabitState.name}" just now.`,
            position: 'bottom',
            visibilityTime: 3000,
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
          position: 'bottom',
          visibilityTime: 3000,
        });
      };

      // Confirmation dialog
      if (Platform.OS === 'web') {
        if (window.confirm(`Do you want to unmark "${currentHabitState.name}" as done for today?`)) {
          unmarkHabit();
        }
      } else {
        setUnmarkFunction(() => unmarkHabit);  // Store the unmark function
        setHabitToUnmark(id);
        setShowUnmarkAlert(true);
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
        position: 'bottom',
        visibilityTime: 2000,
      });

      markedHabit.prevBestStreak = markedHabit.bestStreak;
      // Increment streak (will correctly become 1 if it was reset to 0 by the check)
      markedHabit.currentStreak += 1; 
      const newStreak = markedHabit.currentStreak;

      // Grant freeze?
      if (newStreak > 0 && newStreak % 5 === 0) {
        markedHabit.freezesAvailable = (markedHabit.freezesAvailable || 0) + 1;
        Toast.show({
            type: 'info',
            text1: 'Freeze Earned!',
            text2: `You earned a freeze for "${markedHabit.name}"! Total: ${markedHabit.freezesAvailable}`,
            position: 'bottom',
            visibilityTime: 3000,
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAndCheckHabits();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAndCheckHabits();

  }, []); // Dependency array ensures it runs on mount

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={styles.headerContainer}>
        <ThemedText style={[styles.header, { color: textColor }]}>Ritual</ThemedText>
        <TouchableOpacity
          ref={infoButtonRef}
          style={{ marginLeft: 10, padding: 5 }}
          onPress={() => {
            infoButtonRef.current?.measure(
              (
              x: number,
              y: number,
              width: number,
              height: number,
              pageX: number,
              pageY: number
              ) => {
              setTooltipPosition({ x: pageX + width / 2, y: pageY });
              setTooltipVisible(true);
              }
            );
          }}
        >
          <MaterialIcons name="info-outline" size={20} color={secondaryTextColor} />
        </TouchableOpacity>
      </View>
      
      <Tooltip
        isVisible={tooltipVisible}
        onClose={() => setTooltipVisible(false)}
        text="Press and hold any habit to mark or unmark it as done for today"
        x={tooltipPosition.x}
        y={tooltipPosition.y}
      />
      
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={buttonColor} />
          <ThemedText style={{ marginTop: 10, color: textColor }}>Loading habits...</ThemedText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[buttonColor]}
              tintColor={buttonColor}
              progressBackgroundColor={backgroundColor}
            />
          }
        >
          {habits.length === 0 ? (
            <ThemedText style={{ color: textColor, opacity: 0.5, paddingLeft: 5 }}>
              No habits yet, create a habit by clicking + button
            </ThemedText>
          ) : (
            <FlatList
              data={habits}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 5, paddingBottom: 80 }}
              scrollEnabled={false} // Disable FlatList scrolling since we're using ScrollView
              renderItem={({ item }) => {
                if (!scaleAnimations.current[item.id]) {
                  scaleAnimations.current[item.id] = new Animated.Value(1);
                }

                const today = new Date();
                const todayFormatted = formatDate(today);
                const isCompletedToday = item.lastDone === todayFormatted;

                // --- Updated Logic for isFrozenToday ---
                let isFrozenToday = false;
                
                // Get last dates from both maps
                const lastHeatMapDate = item.heatMap?.length > 0 ? item.heatMap[item.heatMap.length - 1].date : null;
                const lastFreezeMapDate = item.freezeMap?.length > 0 ? item.freezeMap[item.freezeMap.length - 1].date : null;
                
                if (lastHeatMapDate && lastFreezeMapDate) {
                    const lastHeatDate = new Date(parseInt(lastHeatMapDate.split('/')[2]), parseInt(lastHeatMapDate.split('/')[1]) - 1, parseInt(lastHeatMapDate.split('/')[0]));
                    const lastFreezeDate = new Date(parseInt(lastFreezeMapDate.split('/')[2]), parseInt(lastFreezeMapDate.split('/')[1]) - 1, parseInt(lastFreezeMapDate.split('/')[0]));
                    
                    // If last heat map entry is not newer than last freeze AND streak isn't 0
                    if (!(lastHeatDate > lastFreezeDate) && item.currentStreak !== 0) {
                        isFrozenToday = true;
                    }
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
        </ScrollView>
      )}
      <TouchableOpacity style={[styles.addButton, { backgroundColor: buttonColor }]} onPress={() => router.push("/createHabit") }>
        <MaterialIcons name="add" size={24} color={backgroundColor} />
      </TouchableOpacity>
      <CustomAlert
        visible={showUnmarkAlert}
        title="Unmark Habit"
        message={`Do you want to unmark "${habitToUnmark ? habits.find(h => h.id === habitToUnmark)?.name : ''}" as done for today?`}
        buttons={[
          {
            text: "Cancel",
            onPress: () => {
              setShowUnmarkAlert(false);
              setHabitToUnmark(null);
              setUnmarkFunction(null);
            },
            style: "cancel"
          },
          {
            text: "Unmark",
            onPress: () => {
              setShowUnmarkAlert(false);
              if (unmarkFunction) {
                unmarkFunction();
              }
              setHabitToUnmark(null);
              setUnmarkFunction(null);
            },
            style: "destructive"
          }
        ]}
        onDismiss={() => {
          setShowUnmarkAlert(false);
          setHabitToUnmark(null);
          setUnmarkFunction(null);
        }}
      />
    </ThemedView>
  );
};

export default HomeScreen;