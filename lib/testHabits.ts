import { Cell, Habit } from "./types";
import { formatDate } from "./utils";

// Helper to generate dates relative to today
function getDateString(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return formatDate(date);
}

// Helper to create heat map entries for given dates
function createHeatMapEntries(dates: string[], dayMap: { [key: string]: string }): Cell[] {
    return dates.map(date => ({
        day: dayMap[date] || 'error', // This should never hit error if dates are valid
        date
    }));
}

export function generateTestHabits(): Habit[] {
    const today = new Date();
    const dayMap: { [key: string]: string } = {};
    
    // Pre-calculate last 30 days and their day codes for easier reference
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayCode = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'][date.getDay()];
        dayMap[formatDate(date)] = dayCode;
    }

    const habits: Habit[] = [];

    // Habit 1: Tests freeze grant/ungrant, mark/unmark with alive streak
    // Today is Monday, so scheduled today
    // Current streak: 4 (excluding today)
    // Last done: Yesterday (Sunday)
    const habit1: Habit = {
        id: "test1",
        name: "Daily Streak Test",
        icon: "🎯",
        frequency: ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'], // Every day
        reminder: false,
        currentStreak: 4,
        bestStreak: 4,
        lastDone: getDateString(1), // Sunday
        createdOn: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        heatMap: createHeatMapEntries([
            getDateString(4), // Thursday
            getDateString(3), // Friday
            getDateString(2), // Saturday
            getDateString(1)  // Sunday
        ], dayMap),
        freezeMap: [],
        freezesAvailable: 0
    };
    habits.push(habit1);

    // Habit 2: Tests freeze consumption and streak preservation
    // Today is Monday
    // Scheduled: Mon, Wed, Fri (Today is scheduled)
    // Has 2 freezes available
    // Last done: Thursday (4 days ago)
    // Friday was missed - should consume freeze
    const habit2: Habit = {
        id: "test2",
        name: "Freeze Test",
        icon: "❄️",
        frequency: ['M', 'W', 'F'],
        reminder: false,
        currentStreak: 10,
        bestStreak: 10,
        lastDone: getDateString(4), // Thursday
        createdOn: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        heatMap: createHeatMapEntries([
            getDateString(10), // Friday before last
            getDateString(8),  // Monday
            getDateString(6),  // Wednesday
            getDateString(4)   // Thursday
        ], dayMap),
        freezeMap: [],
        freezesAvailable: 2 // Should be consumed for Friday
    };
    habits.push(habit2);

    // Habit 3: Tests frequency change scenarios
    // Today is Monday
    // Changed frequency 2 days ago (Saturday)
    // Old: Mon, Wed, Fri
    // New: Tue, Thu, Sat (Not scheduled today)
    const habit3: Habit = {
        id: "test3",
        name: "Frequency Change Test",
        icon: "📅",
        frequency: ['T', 'Th', 'Sa'], // New frequency
        reminder: false,
        currentStreak: 3,
        bestStreak: 5,
        lastDone: getDateString(2), // Saturday
        createdOn: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        frequencyUpdatedDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Saturday
        heatMap: createHeatMapEntries([
            getDateString(6), // Tuesday
            getDateString(4), // Thursday
            getDateString(2)  // Saturday
        ], dayMap),
        freezeMap: [],
        freezesAvailable: 0
    };
    habits.push(habit3);

    // Habit 4: Tests streak reset when insufficient freezes
    // Today is Monday
    // Scheduled: Tue, Thu, Sun
    // Multiple missed days (Sunday), only 1 freeze available
    // Should reset streak on load
    const habit4: Habit = {
        id: "test4",
        name: "Streak Reset Test",
        icon: "💔",
        frequency: ['T', 'Th', 'S'],
        reminder: false,
        currentStreak: 8,
        bestStreak: 8,
        prevBestStreak: 8,
        lastDone: getDateString(6), // Tuesday
        createdOn: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        heatMap: createHeatMapEntries([
            getDateString(12), // Wednesday
            getDateString(10), // Friday
            getDateString(8),  // Sunday
            getDateString(6)   // Tuesday
        ], dayMap),
        freezeMap: [],
        freezesAvailable: 1 // Not enough for missed Sunday
    };
    habits.push(habit4);

    // Habit 5: Tests frozen state UI and unmark behavior
    // Today is Monday
    // Scheduled: Mon, Thu
    // Last Thursday is frozen (4 days ago)
    const lastScheduledDate = getDateString(4); // Last Thursday
    const habit5: Habit = {
        id: "test5",
        name: "Frozen State Test",
        icon: "🧊",
        frequency: ['M', 'Th'],
        reminder: false,
        currentStreak: 6,
        bestStreak: 6,
        lastDone: getDateString(7), // Last Monday
        createdOn: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        heatMap: createHeatMapEntries([
            getDateString(14), // Last Monday
            getDateString(10), // Last Thursday
            getDateString(7)   // Last Monday
        ], dayMap),
        freezeMap: [{
            day: dayMap[lastScheduledDate], // 'Th'
            date: lastScheduledDate
        }],
        freezesAvailable: 1
    };
    habits.push(habit5);

    // Habit 6: Tests frozen state persistence after frequency change
    // Today is Monday
    // Original frequency: Mon, Wed, Fri
    // New frequency: Tue, Thu, Sat (changed 2 days ago on Saturday)
    // Has frozen state from Friday (old frequency)
    const lastFrozenDate = getDateString(3); // Last Friday
    const habit6: Habit = {
        id: "test6",
        name: "Frozen State After Freq Change",
        icon: "🌡️",
        frequency: ['T', 'Th', 'Sa'], // New frequency
        reminder: false,
        currentStreak: 5,
        bestStreak: 5,
        lastDone: getDateString(5), // Last Wednesday
        createdOn: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        frequencyUpdatedDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Changed Saturday
        heatMap: createHeatMapEntries([
            getDateString(9),  // Last Monday
            getDateString(7),  // Last Wednesday
            getDateString(5)   // Last Wednesday
        ], dayMap),
        freezeMap: [{
            day: dayMap[lastFrozenDate], // 'F'
            date: lastFrozenDate // Last Friday
        }],
        freezesAvailable: 0 // Used freeze for Friday
    };
    habits.push(habit6);

    return habits;
}