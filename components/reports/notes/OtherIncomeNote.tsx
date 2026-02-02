import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { AllData, GenericScheduleItem } from '../../../types.ts';
import { GenericNote } from './GenericNote.tsx';

interface OtherIncomeNoteProps {
    data: GenericScheduleItem[];
    allData: AllData;
    noteId: string;
}

export const OtherIncomeNote: React.FC<OtherIncomeNoteProps> = ({ data, allData, noteId }) => {
    return (
        <GenericNote title="Other Income" data={data} allData={allData} noteId={noteId} />
    );
};