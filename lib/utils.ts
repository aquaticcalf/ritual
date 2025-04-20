import { Cell, Habit } from "./types";

export interface Frequency extends Array<string> {}

// Helper function to format date to dd/mm/yyyy
export const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export const lastSupposedToDoDate = (frequency: Frequency): string => {
  // Use standard day codes matching JavaScript's getDay() (0=Sunday, 6=Saturday)
  const dayNames = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
  const today = new Date();
  const currentDay = today.getDay();
  
  // Look backward up to 7 days to find the most recent scheduled day
  for (let i = 1; i <= 7; i++) {
    // Calculate previous day index (adding 7 to avoid negative numbers)
    const prevDayIndex = (currentDay - i + 7) % 7;
    
    // Check if this previous day is in the habit's frequency
    if (frequency.includes(dayNames[prevDayIndex])) {
      // Calculate the date i days ago
      const prevDate = new Date();
      prevDate.setDate(today.getDate() - i);
      return formatDate(prevDate);
    }
  }
  
  // If no scheduled day found in the past week, return today as fallback
  // This should rarely happen given your assumption that frequency is never empty
  return formatDate(today);
}

export const isStreakAlive = (frequency: Frequency, lastDone: string) => {

  if(lastDone == "") return true;

  const lastToDo = lastSupposedToDoDate(frequency);
  return lastDone == lastToDo || lastDone == formatDate(new Date());
}

export const generateHistoricalHeatMap = (streak: number, frequency: string[]): {
  heatMap: Cell[], 
  lastDone: string,
  createdOnDate: string // Should be dd/mm/yyyy format
} => {
  if (streak <= 0) return {heatMap: [], lastDone: "", createdOnDate: ""};
  
  const days = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
  const result: Cell[] = [];
  const today = new Date();
  
  // Start with yesterday instead of today
  let currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() - 1);
  
  let daysFound = 0;
  let matchingDays: Cell[] = [];
  
  // Look backward to find matching frequency days
  while (daysFound < streak) {
    const dayIndex = currentDate.getDay();
    const dayCode = days[dayIndex];
    
    if (frequency.includes(dayCode)) {
      matchingDays.push({
        day: dayCode,
        date: formatDate(currentDate)
      });
      daysFound++;
    }
    
    // Move to previous day
    currentDate.setDate(currentDate.getDate() - 1);
  }

  currentDate.setDate(currentDate.getDate() + 1);
  const createdOnDate = currentDate.toISOString();
  
  // Reverse to get chronological order (past to future)
  result.push(...matchingDays.reverse());
  
  return {
    heatMap: result,
    lastDone: result.length > 0 ? result[result.length - 1].date : "",
    createdOnDate: createdOnDate
  };
}

// Helper to count missed scheduled days within a specific date range
function countMissedDaysInRange(frequency: string[], startDate: Date, endDate: Date): { count: number, lastMissedDate: string | null } {
    let missedCount = 0;
    let lastMissedFormattedDate: string | null = null;
    const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    // Ensure we compare dates only, not times
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayIndex = currentDate.getDay();
        const dayCode = daysOfWeek[dayIndex];

        if (frequency.includes(dayCode)) {
            missedCount++;
            lastMissedFormattedDate = formatDate(currentDate); // Track the latest missed date
        }

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return { count: missedCount, lastMissedDate: lastMissedFormattedDate };
}


// Calculates the number of scheduled days missed between the last completion and yesterday
function calculateMissedScheduledDays(habit: Habit, today: Date): { count: number, lastMissedDate: string | null } {
    const todayDateOnly = new Date(today);
    todayDateOnly.setHours(0, 0, 0, 0);

    let startDate: Date;
    if (habit.lastDone) {
        const parts = habit.lastDone.split('/');
        // Ensure correct parsing: dd/mm/yyyy -> month is parts[1] - 1
        const lastDoneDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        lastDoneDate.setHours(0, 0, 0, 0);
        startDate = new Date(lastDoneDate);
        startDate.setDate(startDate.getDate() + 1); // Start checking the day *after* last done
    } else if (habit.createdOn) {
        // If never done, check from the day after creation
        const createdDate = new Date(habit.createdOn);
        createdDate.setHours(0, 0, 0, 0);
        startDate = new Date(createdDate);
        startDate.setDate(startDate.getDate() + 1);
    } else {
        // Cannot determine start date if no lastDone and no createdOn
        return { count: 0, lastMissedDate: null };
    }

    // Check up to *yesterday*
    const endDate = new Date(todayDateOnly);
    endDate.setDate(endDate.getDate() - 1);

    if (startDate > endDate) {
        // Last done/created was yesterday or today, or invalid range
        return { count: 0, lastMissedDate: null };
    }

    return countMissedDaysInRange(habit.frequency, startDate, endDate);
}

// New function to handle streak checking, freeze consumption, and status updates
// Returns the potentially updated habit and a flag indicating if the streak was preserved by freezes
export const checkAndUpdateStreak = (habit: Habit, today: Date): { updatedHabit: Habit, streakPreservedByFreeze: boolean } => {
    const formattedToday = formatDate(today);
    let streakPreservedByFreeze = false;

    // Clone habit to avoid direct mutation before returning
    const updatedHabit = { ...habit };
     // Ensure freezesAvailable is initialized if undefined
    if (updatedHabit.freezesAvailable === undefined) {
        updatedHabit.freezesAvailable = 0;
    }

    // Avoid re-checking/consuming freezes multiple times on the same day
    if (updatedHabit.lastCheckedDate === formattedToday) {
        // Even if checked today, we still need to know if the streak is currently alive
        // based on the potentially freeze-updated lastDone date.
        const isCurrentlyAlive = isStreakAlive(updatedHabit.frequency, updatedHabit.lastDone);
         if (!isCurrentlyAlive && updatedHabit.currentStreak > 0) {
            // If it was checked today but somehow became dead (e.g., manual date change?), reset streak.
            // This scenario is unlikely with the current logic but provides a safeguard.
            // Don't reset freezes here, as they were handled during the check.
            console.warn(`Habit "${updatedHabit.name}" streak became dead after being checked today. Resetting streak.`);
            updatedHabit.currentStreak = 0;
         }
        return { updatedHabit, streakPreservedByFreeze: false }; // Not preserved *in this specific call*
    }

    const { count: missedScheduledDaysCount, lastMissedDate } = calculateMissedScheduledDays(updatedHabit, today);

    if (missedScheduledDaysCount > 0) {
        console.log(`Habit "${updatedHabit.name}": Found ${missedScheduledDaysCount} missed scheduled day(s). Available freezes: ${updatedHabit.freezesAvailable}`);
        if (updatedHabit.freezesAvailable >= missedScheduledDaysCount) {
            console.log(`Habit "${updatedHabit.name}": Using ${missedScheduledDaysCount} freeze(s).`);
            updatedHabit.freezesAvailable -= missedScheduledDaysCount;
            streakPreservedByFreeze = true;
            updatedHabit.freezeUsedOn = formattedToday; // Set freeze used date
             // Update lastDone to the date of the last day covered by a freeze
             // This makes the streak "alive" for the next check/completion
            if (lastMissedDate) {
                 updatedHabit.lastDone = lastMissedDate;
            }
            // Show toast feedback - handled in UI layer
        } else {
            console.log(`Habit "${updatedHabit.name}": Not enough freezes (${updatedHabit.freezesAvailable}) for ${missedScheduledDaysCount} missed day(s). Resetting streak.`);
            // Consume remaining freezes
            const freezesConsumed = updatedHabit.freezesAvailable;
            updatedHabit.freezesAvailable = 0;
            // Reset streak
            updatedHabit.currentStreak = 0;
            streakPreservedByFreeze = false;
            updatedHabit.freezeUsedOn = undefined; // Clear freeze used date
             // Show toast feedback - handled in UI layer (consider showing consumed freezes)
        }
    } else {
        // No missed scheduled days requiring freezes.
        updatedHabit.freezeUsedOn = undefined; // Clear freeze used date if no freeze needed
        // Now, check if the streak is naturally alive based on the *original* lastDone date.
        const isNaturallyAlive = isStreakAlive(updatedHabit.frequency, updatedHabit.lastDone);
        if (!isNaturallyAlive && updatedHabit.currentStreak > 0) {
             console.log(`Habit "${updatedHabit.name}": Streak broken naturally (no missed scheduled days, but gap exists). Resetting streak.`);
            updatedHabit.currentStreak = 0;
            updatedHabit.freezeUsedOn = undefined; // Clear freeze used date
            // Show toast feedback - handled in UI layer
        }
    }

    // Update check date regardless of outcome
    updatedHabit.lastCheckedDate = formattedToday;

    return { updatedHabit, streakPreservedByFreeze };
};
