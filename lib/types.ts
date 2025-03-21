export type Cell = {
    day: string; // 'S', 'M', 'T', 'W', 'Th', 'F', 'Sa'
    date: string; // 'dd/mm/yyyy'
};

export type Habit = {
    id: string;
    name: string;
    icon: string;
    frequency: string[];
    reminder: boolean;
    reminderTime?: Date;
    currentStreak: number;
    bestStreak: number;
    prevBestStreak?: number; // Added to keep track of previous best streak
    lastDone: string;
    createdOn: string;
    heatMap: Cell[];
};