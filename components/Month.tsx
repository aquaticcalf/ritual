import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { Text, StyleSheet } from "react-native";
import { ThemedView } from "./ThemedView";

interface MonthComponentProps {
  /** 0-based index of the month: 0=January, 1=February, ... 11=December */
  month: number;
  /** 0 for Sunday, 1 for Monday, ... 6 for Saturday */
  firstDay: number;
  /** If true, use 29 days for February */
  isLeapYear: boolean;
  /** List of dates to highlight in green */
  greens: number[];
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const LEAP_YEAR_DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const MonthComponent: React.FC<MonthComponentProps> = ({
  month,
  firstDay,
  isLeapYear,
  greens,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  // Determine number of days in the specified month
  const daysInMonth = isLeapYear
    ? LEAP_YEAR_DAYS_IN_MONTH[month]
    : DAYS_IN_MONTH[month];

  // We want 6 columns × 7 rows = 42 total cells
  const COLUMNS = 6;
  const ROWS = 7;
  const totalCells = COLUMNS * ROWS;

  // Create an array of 42 cells, all initially null
  const cells: Array<number | null> = Array(totalCells).fill(null);

  // Fill the array so that day 1 starts at index = firstDay,
  // day 2 at index = firstDay + 1, etc., going top-to-bottom,
  // then wrapping to the next column.
  for (let i = 0; i < daysInMonth; i++) {
    const index = i + firstDay;
    if (index < totalCells) {
      cells[index] = i + 1; // days are 1-based
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {cells.map((day, index) => {
        const isGreen = day !== null && greens.includes(day);
        return (
          <ThemedView
            key={index}
            style={[
              styles.cell,
              day
                ? isGreen
                  ? styles.greenCell
                  : styles.grayCell
                : styles.transparentCell,
            ]}
          >
            {day && <Text style={styles.text}>{day}</Text>}
          </ThemedView>
        );
      })}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    // Make items flow top-to-bottom, then wrap to the next column
    flexDirection: "column",
    flexWrap: "wrap",

    // Adjust these so 7 items fit vertically, 6 columns horizontally
    // Example sizes (feel free to tweak):
    height: 7 * 14, // Enough height for 7 cells + margins
    width: 6 * 14,  // Enough width for 6 columns + margins
  },
  cell: {
    width: 12,
    height: 12,
    margin: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
  },
  grayCell: {
    backgroundColor: "gray",
  },
  greenCell: {
    backgroundColor: "green",
  },
  transparentCell: {
    backgroundColor: "transparent",
  },
  text: {
    fontSize: 8,
    color: "white",
  },
});

export default MonthComponent;
