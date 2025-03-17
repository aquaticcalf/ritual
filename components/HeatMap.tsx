import React from "react";
import { ThemedView } from "./ThemedView";
import MonthComponent from "./Month";
import { StyleSheet, View, ScrollView } from "react-native";
import { ThemedText } from "./ThemedText";
import { Cell } from "@/lib/types";

interface HeatMapProps {
  year?: number;
  heatMap?: Cell[];
}

// Month names for display
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "April", "May", "June",
  "July", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Extract month (0-based) and day from date string in dd/mm/yyyy format
const extractMonthAndDay = (dateString: string): { month: number, day: number } | null => {
  if (!dateString) return null;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Convert from 1-based to 0-based
  
  return { month, day };
};

// For a given month, get the array of days that should be marked green
const getGreenDaysForMonth = (heatMap: Cell[] | undefined, targetMonth: number): number[] => {
  if (!heatMap || !heatMap.length) return [];
  
  return heatMap
    .filter(cell => {
      const dateInfo = extractMonthAndDay(cell.date);
      return dateInfo && dateInfo.month === targetMonth;
    })
    .map(cell => {
      const dateInfo = extractMonthAndDay(cell.date);
      return dateInfo ? dateInfo.day : -1;
    })
    .filter(day => day > 0);
};

export function HeatMap({ year = new Date().getFullYear(), heatMap = [] }: HeatMapProps) {
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

  // Calculate first day of each month
  const getFirstDayOfMonth = (month: number) => {
    return new Date(year, month, 1).getDay();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Heat Map for {year}</ThemedText>
      <ScrollView 
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {MONTH_NAMES.map((monthName, index) => {
          // Get green days for this specific month from the heatMap
          const greenDays = getGreenDaysForMonth(heatMap, index);
          
          return (
            <View style={styles.monthWrapper} key={index}>
              <ThemedText style={styles.monthName}>{monthName}</ThemedText>
              <View style={styles.monthContainer}>
                <MonthComponent 
                  month={index} 
                  firstDay={getFirstDayOfMonth(index)}
                  isLeapYear={isLeapYear}
                  greens={greenDays}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center"
  },
  scrollContent: {
    paddingRight: 20, // Add some padding at the end of the scroll
  },
  monthWrapper: {
    marginRight: 20,
    alignItems: "center",
  },
  monthName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  monthContainer: {
    padding: 10,
  }
});