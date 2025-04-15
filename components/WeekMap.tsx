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

  const completedDates = new Set(heatMap.map(cell => cell.date));
  const days = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
  const today = new Date();
  const weekDates: { dayInitial: string; date: string }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayIndex = date.getDay();
    weekDates.push({ dayInitial: days[dayIndex], date: formatDate(date) });
  }

  return (
    <View style={styles.container}>
      {weekDates.map(({ dayInitial, date }, index) => {
        const isCompleted = completedDates.has(date);
        return (
          <View 
            key={index} 
            style={[
              styles.dayCell,
              { backgroundColor: isCompleted ? activeColor : cardColor, borderColor: inactiveColor }
            ]}
          >
            <ThemedText style={[
              styles.dayText,
              { color: isCompleted ? cardColor : textColor }
            ]}>
              {dayInitial}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10, // Add some space above the week map
    paddingHorizontal: 5, // Align with habit item padding
  },
  dayCell: {
    width: 30,
    height: 30,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dayText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default WeekMap;
