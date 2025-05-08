import React, { useRef, useEffect } from "react";
import { ThemedView } from "./ThemedView";
import MonthComponent from "./Month";
import { StyleSheet, View, ScrollView } from "react-native";
import { ThemedText } from "./ThemedText";
import { Cell } from "@/lib/types";
import { useThemeColor } from "@/hooks/useThemeColor";

interface HeatMapProps {
  year?: number;
  heatMap?: Cell[];
  freezeMap?: Cell[];
  createdOn?: string;
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

// Extract creation date info
const extractCreationInfo = (createdOn: string | undefined): { year: number, month: number, day: number } | null => {
  if (!createdOn) return null;
  
  const date = new Date(createdOn);
  if (isNaN(date.getTime())) return null;
  
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate()
  };
};

// Helper function to get marked days for a specific map and month
const getMarkedDaysForMonth = (map: Cell[] | undefined, targetMonth: number): number[] => {
  if (!map || !map.length) return [];
  
  return map
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

// Accept freezeMap prop
export function HeatMap({ 
  year = new Date().getFullYear(), 
  heatMap = [], 
  freezeMap = [],
  createdOn 
}: HeatMapProps) {
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault');
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const scrollViewRef = useRef<ScrollView>(null);
  const currentMonth = new Date().getMonth();
  const creationInfo = extractCreationInfo(createdOn);

  const getFirstDayOfMonth = (month: number) => {
    return new Date(year, month, 1).getDay();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollViewRef.current) {
        const MONTH_WIDTH = 108; // Adjusted to match new monthWrapper width
        const scrollToX = currentMonth * MONTH_WIDTH;
        scrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentMonth]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Heat Map for {year}</ThemedText>
      <ScrollView 
        ref={scrollViewRef}
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {MONTH_NAMES.map((monthName, index) => {
          // Get green days (completions)
          const greenDays = getMarkedDaysForMonth(heatMap, index);
          // Get blue days (freezes)
          const blueDays = getMarkedDaysForMonth(freezeMap, index);
          
          const isBeforeCreationMonth = creationInfo && 
            (year < creationInfo.year || 
             (year === creationInfo.year && index < creationInfo.month));
          
          const creationDay = (creationInfo && 
                              year === creationInfo.year && 
                              index === creationInfo.month) 
                              ? creationInfo.day 
                              : -1;
          
          return (
            <View style={styles.monthWrapper} key={index}>
              <ThemedText style={[styles.monthName, { color: secondaryTextColor }]}>{monthName}</ThemedText>
              <View style={styles.monthContainer}>
                <MonthComponent 
                  month={index} 
                  firstDay={getFirstDayOfMonth(index)}
                  isLeapYear={isLeapYear}
                  greens={greenDays}
                  blues={blueDays}
                  isBeforeCreationMonth={isBeforeCreationMonth ?? undefined}
                  creationDay={creationDay}
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
    paddingRight: 15, // Reduced from 20
  },
  monthWrapper: {
    marginRight: 12, // Reduced from 20
    alignItems: "center",
    width: 108, // Adjusted to match new month component width
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