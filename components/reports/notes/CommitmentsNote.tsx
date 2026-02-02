import React from 'react';
import { AllData, ContingentLiability, GenericScheduleItem } from '../../../types.ts';
import { GenericNote } from './GenericNote.tsx';

interface CommitmentsNoteProps {
    data: ContingentLiability[];
    allData: AllData;
}

export const CommitmentsNote: React.FC<CommitmentsNoteProps> = ({ data, allData }) => {
    const genericData: GenericScheduleItem[] = data.map(item => ({
        id: item.id,
        particular: item.nature,
        amountCy: item.amountCy,
        amountPy: item.amountPy,
    }));
    return (
        <GenericNote title="Commitments" data={genericData} allData={allData} noteId="commitments" />
    );
};