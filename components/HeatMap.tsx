import React, { useRef, useEffect } from "react";
import { ThemedView } from "./ThemedView";
import MonthComponent from "./Month";
import { StyleSheet, View, ScrollView } from "react-native";
import { ThemedText } from "./ThemedText";
import { Cell } from "@/lib/types";

interface HeatMapProps {
  year?: number;
  heatMap?: Cell[];
  createdOn?: string; // Add createdOn prop
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

export function HeatMap({ year = new Date().getFullYear(), heatMap = [], createdOn }: HeatMapProps) {
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  // Create a ref for the ScrollView
  const scrollViewRef = useRef<ScrollView>(null);
  // Get current month
  const currentMonth = new Date().getMonth();
  
  // Get creation date info
  const creationInfo = extractCreationInfo(createdOn);

  // Calculate first day of each month
  const getFirstDayOfMonth = (month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Scroll to current month when component mounts
  useEffect(() => {
    // Add a small delay to ensure the ScrollView has rendered
    const timer = setTimeout(() => {
      if (scrollViewRef.current) {
        // Calculate position to scroll to - estimate width of each month container + margin
        const MONTH_WIDTH = 120; // Approximate width of each month container including margin
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
          // Get green days for this specific month from the heatMap
          const greenDays = getGreenDaysForMonth(heatMap, index);
          
          // Calculate if this month is before creation date
          const isBeforeCreationMonth = creationInfo && 
            (year < creationInfo.year || 
             (year === creationInfo.year && index < creationInfo.month));
          
          // For same month as creation, pass the day to show which days should be dimmed
          const creationDay = (creationInfo && 
                              year === creationInfo.year && 
                              index === creationInfo.month) 
                              ? creationInfo.day 
                              : -1;
          
          return (
            <View style={styles.monthWrapper} key={index}>
              <ThemedText style={styles.monthName}>{monthName}</ThemedText>
              <View style={styles.monthContainer}>
                <MonthComponent 
                  month={index} 
                  firstDay={getFirstDayOfMonth(index)}
                  isLeapYear={isLeapYear}
                  greens={greenDays}
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
    paddingRight: 20, // Add some padding at the end of the scroll
  },
  monthWrapper: {
    marginRight: 20,
    alignItems: "center",
    width: 100, // Set a consistent width for month container
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