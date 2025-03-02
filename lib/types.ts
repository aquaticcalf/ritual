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
};