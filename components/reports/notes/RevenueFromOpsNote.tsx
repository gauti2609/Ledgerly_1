


import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { AllData, GenericScheduleItem } from '../../../types.ts';
import { GenericNote } from './GenericNote.tsx';

interface RevenueFromOpsNoteProps {
    data: GenericScheduleItem[];
    allData: AllData;
    noteId: string;
}

export const RevenueFromOpsNote: React.FC<RevenueFromOpsNoteProps> = ({ data, allData, noteId }) => {
    return (
        <GenericNote title="Revenue from Operations" data={data} allData={allData} noteId={noteId} />
    );
};