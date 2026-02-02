import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { AllData, GenericScheduleItem } from '../../../types.ts';
import { GenericNote } from './GenericNote.tsx';

interface FinanceCostsNoteProps {
    data: GenericScheduleItem[];
    allData: AllData;
    noteId: string;
}

export const FinanceCostsNote: React.FC<FinanceCostsNoteProps> = ({ data, allData, noteId }) => {
    return (
        <GenericNote title="Finance Costs" data={data} allData={allData} noteId={noteId} />
    );
};