// components/schedules/CurrentInvestmentsSchedule.tsx
import React from 'react';
import { InvestmentsScheduleData } from '../../types.ts';
import { InvestmentsSchedule } from './InvestmentsSchedule.tsx';

interface CurrentInvestmentsScheduleProps {
    data: InvestmentsScheduleData;
    onUpdate: (data: InvestmentsScheduleData) => void;
    isFinalized: boolean;
}

export const CurrentInvestmentsSchedule: React.FC<CurrentInvestmentsScheduleProps> = ({ data, onUpdate, isFinalized }) => {
    return (
        // Re-using the InvestmentsSchedule component as the structure is identical
        <InvestmentsSchedule
            data={data}
            onUpdate={onUpdate}
            isFinalized={isFinalized}
        />
    );
};
