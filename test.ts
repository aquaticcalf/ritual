import { Habit } from '@/lib/types';
import { formatDate } from '@/lib/utils'; // Make sure formatDate is accessible here

// --- Helper to get dates relative to today ---
const getDateDaysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0); // Normalize time
  return date;
};

// --- Test Habits ---

const testHabit1: Habit = {
  id: 'test-freeze-save',
  name: 'Test Freeze Save',
  icon: '🧪',
  frequency: ['M', 'W', 'F', 'S'], // Scheduled Mon, Wed, Fri, Sun
  reminder: false,
  currentStreak: 10,
  bestStreak: 10,
  // Assume today is Sunday. Last done was last Sunday (7 days ago). Missed Mon, Wed, Fri.
  lastDone: formatDate(getDateDaysAgo(7)),
  createdOn: getDateDaysAgo(30).toISOString(),
  heatMap: [ /* Populate if needed, less critical for streak logic */ ],
  freezesAvailable: 4, // Should have enough freezes (needs 3)
  lastCheckedDate: formatDate(getDateDaysAgo(1)), // Checked yesterday (Saturday)
  freezeUsedOn: undefined, // Initialize as undefined
};

const testHabit2: Habit = {
  id: 'test-freeze-fail',
  name: 'Test Freeze Fail',
  icon: '💥',
  frequency: ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'], // Scheduled Every Day
  reminder: false,
  currentStreak: 8,
  bestStreak: 8,
   // Assume today is Sunday. Last done Thursday (3 days ago). Missed Fri & Sat.
  lastDone: formatDate(getDateDaysAgo(3)),
  createdOn: getDateDaysAgo(30).toISOString(),
  heatMap: [],
  freezesAvailable: 1, // Not enough freezes (needs 2)
  // lastCheckedDate: undefined // Hasn't been checked recently
  freezeUsedOn: undefined, // Initialize as undefined
};

const testHabit3: Habit = {
  id: 'test-freeze-earn',
  name: 'Test Freeze Earn',
  icon: '🏆',
  frequency: ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'], // Every day
  reminder: false,
  currentStreak: 4, // About to hit 5
  bestStreak: 4,
  lastDone: formatDate(getDateDaysAgo(1)), // Done yesterday (Saturday)
  createdOn: getDateDaysAgo(10).toISOString(),
  heatMap: [],
  freezesAvailable: 0,
  lastCheckedDate: formatDate(getDateDaysAgo(1)), // Checked yesterday
  freezeUsedOn: undefined, // Initialize as undefined
};

const testHabit4: Habit = {
  id: 'test-already-checked',
  name: 'Test Already Checked',
  icon: '👀',
  frequency: ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'], // Every day
  reminder: false,
  currentStreak: 2, // Streak should break, but has 1 freeze
  bestStreak: 2,
  lastDone: formatDate(getDateDaysAgo(2)), // Missed yesterday (Saturday)
  createdOn: getDateDaysAgo(10).toISOString(),
  heatMap: [],
  freezesAvailable: 1,
  lastCheckedDate: formatDate(new Date()), // ALREADY CHECKED TODAY (Sunday)
  freezeUsedOn: undefined, // Initialize as undefined
};


export const allTestHabits: Habit[] = [testHabit1, testHabit2, testHabit3, testHabit4];