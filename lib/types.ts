export type Cell = {
    day: string;
    date: string;
    isDone: boolean;
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
	lastDone: string;
	createdOn: string;
	heatMap: Cell[];
};