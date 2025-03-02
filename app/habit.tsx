import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '@/lib/types';
import { reloadHabitReminders } from '@/lib/notifications';

const HabitPage = () => {
  const { habit } = useLocalSearchParams();
  const habitData: Habit | null = typeof habit === 'string' ? JSON.parse(habit) : null;
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackgroundColor = useThemeColor({}, 'card');
  const navigation = useNavigation();
  const router = useRouter();

  const handleDelete = async () => {
    if (habitData) {
      try {
        const storedHabits = await AsyncStorage.getItem('habits');
        const habits = storedHabits ? JSON.parse(storedHabits) : [];
        const updatedHabits = habits.filter((h: Habit) => h.id !== habitData.id);
        await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));

        // clear the current notification schedule for the habit
        await reloadHabitReminders(updatedHabits);

        router.push('/');
      } catch (error) {
        console.error('Failed to delete the habit:', error);
      }
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: handleDelete, style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    if (habitData) {
      navigation.setOptions({ title: `${habitData.icon} ${habitData.name}` });
    }
  }, [habitData]);

  if (!habitData) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <ThemedText style={[styles.title, { color: textColor }]}>Habit not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={[styles.statBox, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText style={[styles.statTitle, { color: textColor }]}>Current Streak</ThemedText>
            <ThemedText style={[styles.statValue, { color: textColor }]}>{habitData.currentStreak}🔥</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statBox, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText style={[styles.statTitle, { color: textColor }]}>Best Streak</ThemedText>
            <ThemedText style={[styles.statValue, { color: textColor }]}>{habitData.bestStreak}🔥</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={[styles.infoBox, { backgroundColor: cardBackgroundColor }]}>
          <ThemedText style={[styles.infoTitle, { color: textColor }]}>Frequency</ThemedText>
          <ThemedView style={[styles.frequencyContainer, { backgroundColor: cardBackgroundColor }]}>
            {["M", "T", "W", "Th", "F", "Sa", "S"].map((day) => (
              <ThemedView 
                key={day}
                style={[
                  styles.dayBadge,
                  { 
                    backgroundColor: habitData.frequency.includes(day) ? useThemeColor({}, 'tint') : 'transparent',
                    borderColor: useThemeColor({}, 'icon'),
                  }
                ]}
              >
                <ThemedText 
                  style={[
                    styles.dayText, 
                    { 
                      color: habitData.frequency.includes(day) ? backgroundColor : textColor,
                      fontWeight: habitData.frequency.includes(day) ? 'bold' : 'normal',
                    }
                  ]}
                >
                  {day}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>

        {habitData.reminder && (
          <ThemedView style={[styles.infoBox, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText style={[styles.infoTitle, { color: textColor }]}>Reminder Time</ThemedText>
            <ThemedText style={[styles.infoValue, { color: textColor }]}>
              {habitData.reminderTime ? new Date(habitData.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView style={[styles.infoBox, { backgroundColor: cardBackgroundColor }]}>
          <ThemedText style={[styles.infoTitle, { color: textColor }]}>Habit Created On</ThemedText>
          <ThemedText style={[styles.infoValue, { color: textColor }]}>{new Date(habitData.createdOn).toLocaleDateString()}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.header}>
          <TouchableOpacity style={[styles.button, { backgroundColor: cardBackgroundColor }]} onPress={() => router.push({ pathname: '/createHabit', params: { habit: JSON.stringify(habitData) } })}>
            <Ionicons name="pencil" size={20} color={textColor} />
            <ThemedText style={styles.buttonText}> Edit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: cardBackgroundColor }]} onPress={confirmDelete}>
            <Ionicons name="trash" size={20} color={textColor} />
            <ThemedText style={styles.buttonText}> Delete</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  infoBox: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'light',
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  dayBadge: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    minWidth: 32,
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
  },
});

export default HabitPage;