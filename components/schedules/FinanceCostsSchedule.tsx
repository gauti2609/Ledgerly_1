import React from 'react';
import { GenericScheduleItem } from '../../types.ts';
import { GenericSchedule } from './GenericSchedule.tsx';

interface FinanceCostsScheduleProps {
    data: GenericScheduleItem[];
    onUpdate: (data: GenericScheduleItem[]) => void;
    isFinalized: boolean;
    trialBalanceData?: any[];
}

export const FinanceCostsSchedule: React.FC<FinanceCostsScheduleProps> = ({ data, onUpdate, isFinalized, trialBalanceData }) => {

    return (
        <GenericSchedule
            title="Finance Costs"
            data={data}
            onUpdate={onUpdate}
            isFinalized={isFinalized}
            trialBalanceData={trialBalanceData}
        />
    );
};