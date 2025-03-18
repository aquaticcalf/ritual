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
