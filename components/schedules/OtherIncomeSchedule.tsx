import React from 'react';
import { GenericScheduleItem } from '../../types.ts';
import { GenericSchedule } from './GenericSchedule.tsx';

interface OtherIncomeScheduleProps {
    data: GenericScheduleItem[];
    onUpdate: (data: GenericScheduleItem[]) => void;
    isFinalized: boolean;
    trialBalanceData?: any[];
}

export const OtherIncomeSchedule: React.FC<OtherIncomeScheduleProps> = ({ data, onUpdate, isFinalized, trialBalanceData }) => {

    return (
        <GenericSchedule
            title="Other Income"
            data={data}
            onUpdate={onUpdate}
            isFinalized={isFinalized}
            trialBalanceData={trialBalanceData}
        />
    );
};