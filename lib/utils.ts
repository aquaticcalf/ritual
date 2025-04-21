import { Cell, Habit } from "./types";

export interface Frequency extends Array<string> { }

// Helper function to format date to dd/mm/yyyy
export const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export const generateHistoricalHeatMap = (streak: number, frequency: string[]): {
    heatMap: Cell[],
    lastDone: string,
    createdOnDate: string
} => {
    if (streak <= 0) return { heatMap: [], lastDone: "", createdOnDate: new Date().toISOString() }; // Default createdOn

    const days = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    const result: Cell[] = [];
    const today = new Date();

    // Start with yesterday instead of today
    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() - 1);
    currentDate.setHours(0, 0, 0, 0); // Ensure date only

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

    // The day *before* the first day added to the heatmap is the effective creation day for streak purposes
    const createdOnDate = currentDate.toISOString();

    // Reverse to get chronological order (past to future)
    result.push(...matchingDays.reverse());

    return {
        heatMap: result,
        lastDone: result.length > 0 ? result[result.length - 1].date : "",
        createdOnDate: createdOnDate
    };
}

// Helper to find all scheduled, missed dates within a specific date range
function findMissedDatesInRange(frequency: string[], startDate: Date, endDate: Date): string[] {
    const missedDates: string[] = [];
    const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    // Ensure we compare dates only, not times
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayIndex = currentDate.getDay();
        const dayCode = daysOfWeek[dayIndex];

        if (frequency.includes(dayCode)) {
            missedDates.push(formatDate(currentDate));
        }

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return missedDates;
}


// Calculates the list of scheduled days missed between the last completion/freeze and yesterday
function calculateMissedScheduledDays(habit: Habit, today: Date): { missedDates: string[] } {
    const todayDateOnly = new Date(today);
    todayDateOnly.setHours(0, 0, 0, 0);

    // Determine the effective last completed date (considering freezes)
    let lastCompletionOrFreezeDateStr = habit.lastDone;
    if (habit.freezeMap && habit.freezeMap.length > 0) {
        // Find the latest date in the freeze map
        const latestFreezeDateStr = habit.freezeMap.reduce((latest, current) => {
            const latestParts = latest.date.split('/');
            const currentParts = current.date.split('/');
            const latestDate = new Date(parseInt(latestParts[2]), parseInt(latestParts[1]) - 1, parseInt(latestParts[0]));
            const currentDate = new Date(parseInt(currentParts[2]), parseInt(currentParts[1]) - 1, parseInt(currentParts[0]));
            return currentDate > latestDate ? current : latest;
        }).date;

        // If a freeze date is later than lastDone, use the freeze date
        if (latestFreezeDateStr) {
            const latestFreezeDate = new Date(parseInt(latestFreezeDateStr.split('/')[2]), parseInt(latestFreezeDateStr.split('/')[1]) - 1, parseInt(latestFreezeDateStr.split('/')[0]));
            const lastDoneDate = habit.lastDone ? new Date(parseInt(habit.lastDone.split('/')[2]), parseInt(habit.lastDone.split('/')[1]) - 1, parseInt(habit.lastDone.split('/')[0])) : null;

            if (!lastDoneDate || latestFreezeDate > lastDoneDate) {
                lastCompletionOrFreezeDateStr = latestFreezeDateStr;
            }
        }
    }

    let startDate: Date;
    if (lastCompletionOrFreezeDateStr) {
        const parts = lastCompletionOrFreezeDateStr.split('/');
        const effectiveLastDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        effectiveLastDate.setHours(0, 0, 0, 0);
        startDate = new Date(effectiveLastDate);
        startDate.setDate(startDate.getDate() + 1); // Start checking the day *after*
    } else if (habit.createdOn) {
        const createdDate = new Date(habit.createdOn);
        createdDate.setHours(0, 0, 0, 0);
        startDate = new Date(createdDate);
        // If created today, no missed days yet. If created in past, start check day after creation.
        if (formatDate(createdDate) !== formatDate(today)) {
            startDate.setDate(startDate.getDate() + 1);
        }
    } else {
        // Cannot determine start date
        return { missedDates: [] };
    }

    // Check up to *yesterday*
    const endDate = new Date(todayDateOnly);
    endDate.setDate(endDate.getDate() - 1);

    if (startDate > endDate) {
        // Start date is after end date (e.g., last done was yesterday or today)
        return { missedDates: [] };
    }

    return { missedDates: findMissedDatesInRange(habit.frequency, startDate, endDate) };
}

// New function using freezeMap
// Returns the potentially updated habit and flags indicating changes
export const checkAndUpdateStreak = (habit: Habit, today: Date): {
    updatedHabit: Habit;
    freezesConsumed: number;
    streakBroken: boolean;
} => {
    const formattedToday = formatDate(today);
    let freezesConsumed = 0;
    let streakBroken = false;

    // Clone habit and initialize maps if necessary
    const updatedHabit = {
         ...habit,
         heatMap: habit.heatMap || [],
         freezeMap: habit.freezeMap || [],
         freezesAvailable: habit.freezesAvailable === undefined ? 0 : habit.freezesAvailable
    };

    // Avoid re-checking/consuming freezes multiple times on the same day
    if (updatedHabit.lastCheckedDate === formattedToday) {
        // If checked today, no further action needed here. The state is considered current for the day.
        return { updatedHabit, freezesConsumed: 0, streakBroken: false };
    }

    const { missedDates } = calculateMissedScheduledDays(updatedHabit, today);
    const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa']; // For adding day code to map

    if (missedDates.length > 0) {
        console.log(`Habit "${updatedHabit.name}": Found ${missedDates.length} missed scheduled day(s): ${missedDates.join(', ')}. Available freezes: ${updatedHabit.freezesAvailable}`);

        for (const missedDate of missedDates) {
            // Is this date already covered by a freeze?
            const isAlreadyFrozen = updatedHabit.freezeMap.some(cell => cell.date === missedDate);

            if (isAlreadyFrozen) {
                console.log(` - Date ${missedDate} is already frozen.`);
                continue; // Skip, already accounted for
            }

            // Can we use a freeze?
            if (updatedHabit.freezesAvailable > 0) {
                console.log(` - Using freeze for ${missedDate}. Freezes remaining: ${updatedHabit.freezesAvailable - 1}`);
                updatedHabit.freezesAvailable--;
                freezesConsumed++;

                // Add to freezeMap
                const parts = missedDate.split('/');
                const missedDateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                const dayCode = daysOfWeek[missedDateObj.getDay()];
                updatedHabit.freezeMap.push({ day: dayCode, date: missedDate });

            } else {
                // No freezes left for an unfrozen missed day - streak breaks
                console.log(` - Not enough freezes for ${missedDate}. Resetting streak.`);
                updatedHabit.currentStreak = 0;
                streakBroken = true;
                // Optional: Clear future freezes if streak breaks?
                // updatedHabit.freezesAvailable = 0;
                break; // Stop checking further missed dates for this habit
            }
        }
    }

    // Update check date regardless of outcome
    updatedHabit.lastCheckedDate = formattedToday;

    // Sort freezeMap just in case, although insertion order should be chronological
    updatedHabit.freezeMap.sort((a, b) => {
        const dateA = new Date(parseInt(a.date.split('/')[2]), parseInt(a.date.split('/')[1]) - 1, parseInt(a.date.split('/')[0]));
        const dateB = new Date(parseInt(b.date.split('/')[2]), parseInt(b.date.split('/')[1]) - 1, parseInt(b.date.split('/')[0]));
        return dateA.getTime() - dateB.getTime();
    });

    return { updatedHabit, freezesConsumed, streakBroken };
};

// Helper function to find the last date a habit was scheduled before a given date
export const findLastScheduledDateBefore = (frequency: string[], beforeDate: Date): string | null => {
    const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    let checkDate = new Date(beforeDate);
    checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday
  
    for (let i = 0; i < 7; i++) { // Check up to 7 days back
      const dayIndex = checkDate.getDay();
      const dayCode = daysOfWeek[dayIndex];
  
      if (frequency.includes(dayCode)) {
        return formatDate(checkDate);
      }
      checkDate.setDate(checkDate.getDate() - 1); // Move to the previous day
    }
  
    return null; // No scheduled day found within the last week
  };
