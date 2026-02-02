import React from 'react';
import { ScheduleData, ContingentLiability, GenericScheduleItem } from '../../types.ts';
import { GenericSchedule } from './GenericSchedule.tsx';

interface CommitmentsScheduleProps {
    data: ContingentLiability[];
    onUpdate: (data: ContingentLiability[]) => void;
    isFinalized: boolean;
}

export const CommitmentsSchedule: React.FC<CommitmentsScheduleProps> = ({ data, onUpdate, isFinalized }) => {
    
    const genericData: GenericScheduleItem[] = data.map(item => ({
        id: item.id,
        particular: item.nature,
        amountCy: item.amountCy,
        amountPy: item.amountPy,
    }));

    const handleUpdate = (updatedData: GenericScheduleItem[]) => {
        onUpdate(updatedData.map(item => ({
            id: item.id,
            nature: item.particular,
            amountCy: item.amountCy,
            amountPy: item.amountPy,
        })));
    };
    
    return (
        <GenericSchedule
            title="Commitments"
            data={genericData}
            onUpdate={handleUpdate}
            isFinalized={isFinalized}
        />
    );
};