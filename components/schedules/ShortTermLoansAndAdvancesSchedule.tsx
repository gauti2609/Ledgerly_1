// components/schedules/ShortTermLoansAndAdvancesSchedule.tsx
import React from 'react';
import { LoansAndAdvancesScheduleData } from '../../types.ts';
import { LoansAndAdvancesSchedule } from './LoansAndAdvancesSchedule.tsx';

interface ShortTermLoansAndAdvancesScheduleProps {
    data: LoansAndAdvancesScheduleData;
    onUpdate: (data: LoansAndAdvancesScheduleData) => void;
    isFinalized: boolean;
}

export const ShortTermLoansAndAdvancesSchedule: React.FC<ShortTermLoansAndAdvancesScheduleProps> = ({ data, onUpdate, isFinalized }) => {
    return (
        // Re-using the LoansAndAdvancesSchedule component as the structure is identical
        <LoansAndAdvancesSchedule
            data={data}
            onUpdate={onUpdate}
            isFinalized={isFinalized}
        />
    );
};
