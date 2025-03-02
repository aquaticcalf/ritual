
export interface Frequency extends Array<string> {}

// Helper function to format date to dd/mm/yyyy
export const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export const lastSupposedToDoDate = (frequency: Frequency): string => {
  const day: number = new Date().getDay();
  // compare the last 7 days with the habit frequency and return the date of the last day the habit is supposed to be done
  const dys: Array<string> = ['S', 'Sa', 'F', 'Th', 'W', 'T', 'M'];
  for (let i = 1; i < 7; i++) {
    if (frequency.includes(dys[(day + i) % 7])) {
      const date = new Date(new Date().setDate(new Date().getDate() - i));
      return formatDate(date);
    }
  }
  const today = new Date();
  return formatDate(today);
}

export const isStreakAlive = (frequency: Frequency, lastDone: string) => {
  const lastToDo = lastSupposedToDoDate(frequency);
  return lastDone == lastToDo || lastDone == formatDate(new Date());
}
