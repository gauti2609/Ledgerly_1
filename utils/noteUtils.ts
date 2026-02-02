import { ScheduleData } from '../types.ts';

/**
 * Generates a map of note IDs to their dynamic, sequential number.
 * This is based on the user's selections and the predefined order.
 * @param noteSelections - The array of note selection objects from scheduleData.
 * @returns A record where the key is the note ID and the value is its sequential number.
 */
export const getNoteNumberMap = (noteSelections: ScheduleData['noteSelections']): Record<string, number> => {
    const selectedAndSortedNotes = noteSelections
        .filter(note => note.isSelected)
        .sort((a, b) => a.order - b.order);

    const noteMap: Record<string, number> = {};
    selectedAndSortedNotes.forEach((note, index) => {
        noteMap[note.id] = index + 1;
    });

    return noteMap;
};
