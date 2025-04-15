import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatDate } from '@/lib/utils';
import { Cell } from '@/lib/types';

interface WeekMapProps {
  heatMap: Cell[];
}

const WeekMap: React.FC<WeekMapProps> = ({ heatMap }) => {
  const inactiveColor = useThemeColor({}, 'tabIconDefault');
  const activeColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');
  const subtleTextColor = useThemeColor({}, 'tabIconDefault');

  const completedDates = new Set(heatMap.map(cell => cell.date));
  const dayInitials = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const currentDayIndex = today.getDay();
  const weekDates: { dayInitial: string; dateNumber: string; fullDate: string }[] = [];

  const sundayDate = new Date(today);
  sundayDate.setDate(today.getDate() - currentDayIndex);

  for (let i = 0; i < 7; i++) {
    const date = new Date(sundayDate);
    date.setDate(sundayDate.getDate() + i);
    weekDates.push({
      dayInitial: dayInitials[i],
      dateNumber: date.getDate().toString(),
      fullDate: formatDate(date)
    });
  }

  return (
    <View style={styles.container}>
      {weekDates.map(({ dayInitial, dateNumber, fullDate }, index) => {
        const isCompleted = completedDates.has(fullDate);
        return (
          <View key={index} style={styles.dayContainer}>
            <ThemedText style={[styles.dayInitialText, { color: subtleTextColor }]}>
              {dayInitial}
            </ThemedText>
            <View 
              style={[
                styles.dayCell,
                {
                  backgroundColor: isCompleted ? activeColor : cardColor, 
                  borderColor: inactiveColor 
                }
              ]}
            >
              <ThemedText style={[
                styles.dayNumberText,
                { color: isCompleted ? cardColor : textColor }
              ]}>
                {dateNumber}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 5,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayInitialText: {
    fontSize: 10,
    marginBottom: 4,
    fontWeight: '500',
  },
  dayCell: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default WeekMap;
