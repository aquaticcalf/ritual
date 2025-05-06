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

// Calculate the date range to check for missed scheduled days
function getStartAndEndDateOfMissedScheduledDates(habit: Habit, today: Date): { 
    startDate: Date | null;
    endDate: Date;
} {
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

    // Convert frequency update date to a Date object if it exists
    const frequencyUpdateDate = habit.frequencyUpdatedDate ? new Date(habit.frequencyUpdatedDate) : null;
    if (frequencyUpdateDate) {
        frequencyUpdateDate.setHours(0, 0, 0, 0);
    }

    let startDate: Date | null;
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
        startDate = null;
    }

    // If frequency was updated, use that as the minimum start date
    if (frequencyUpdateDate && startDate && frequencyUpdateDate > startDate) {
        startDate = new Date(frequencyUpdateDate);
    }

    // Check up to *yesterday*
    const endDate = new Date(todayDateOnly);
    endDate.setDate(endDate.getDate() - 1);

    return { startDate, endDate };
}

// New function using freezeMap
// Returns the potentially updated habit and flags indicating changes
export const checkAndUpdateStreak = (habit: Habit, today: Date): {
    updatedHabit: Habit;
    freezesConsumed: number;
    streakBroken: boolean;
} => {
    const formattedToday = formatDate(today);
    const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    
    // Clone habit and initialize maps if necessary
    const updatedHabit = {
        ...habit,
        heatMap: habit.heatMap || [],
        freezeMap: habit.freezeMap || [],
        freezesAvailable: habit.freezesAvailable === undefined ? 0 : habit.freezesAvailable
    };

    // Avoid re-checking multiple times on the same day
    if (updatedHabit.lastCheckedDate === formattedToday) {
        return { updatedHabit, freezesConsumed: 0, streakBroken: false };
    }

    // Always update check date
    updatedHabit.lastCheckedDate = formattedToday;

    // Early exit if streak is already broken (no point consuming freezes)
    if (updatedHabit.currentStreak === 0) {
        return { updatedHabit, freezesConsumed: 0, streakBroken: false };
    }

    // Get start and end dates for missed scheduled days
    const { startDate, endDate } = getStartAndEndDateOfMissedScheduledDates(updatedHabit, today);

    if (!startDate || startDate > endDate) {
        // Start date is after end date (e.g., last done was yesterday or today)
        return { updatedHabit, freezesConsumed: 0, streakBroken: false };
    }

    let freezesConsumed = 0;
    let currentDate = new Date(startDate);

    // Single loop to process all dates
    while (currentDate <= endDate) {
        const dayIndex = currentDate.getDay();
        const dayCode = daysOfWeek[dayIndex];
        const formattedDate = formatDate(currentDate);

        if (updatedHabit.frequency.includes(dayCode)) {
            // If no freezes available, break streak and exit
            if (updatedHabit.freezesAvailable <= 0) {
                updatedHabit.currentStreak = 0;
                return { updatedHabit, freezesConsumed, streakBroken: true };
            }

            // Consume a freeze and add to freezeMap
            updatedHabit.freezesAvailable--;
            freezesConsumed++;
            updatedHabit.freezeMap.push({ day: dayCode, date: formattedDate });
        }

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Only sort if new freezes were added
    if (freezesConsumed > 0) {
        updatedHabit.freezeMap.sort((a, b) => {
            const dateA = new Date(parseInt(a.date.split('/')[2]), parseInt(a.date.split('/')[1]) - 1, parseInt(a.date.split('/')[0]));
            const dateB = new Date(parseInt(b.date.split('/')[2]), parseInt(b.date.split('/')[1]) - 1, parseInt(b.date.split('/')[0]));
            return dateA.getTime() - dateB.getTime();
        });
    }

    return { updatedHabit, freezesConsumed, streakBroken: false };
};
