// components/schedules/PurchasesSchedule.tsx
import React from 'react';
import { GenericScheduleItem } from '../../types.ts';
import { GenericSchedule } from './GenericSchedule.tsx';

interface PurchasesScheduleProps {
    data: GenericScheduleItem[];
    onUpdate: (data: GenericScheduleItem[]) => void;
    isFinalized: boolean;
    trialBalanceData?: any[];
}

export const PurchasesSchedule: React.FC<PurchasesScheduleProps> = ({ data, onUpdate, isFinalized, trialBalanceData }) => {
    return (
        <GenericSchedule
            title="Purchases of Stock-in-Trade"
            data={data}
            onUpdate={onUpdate}
            isFinalized={isFinalized}
            trialBalanceData={trialBalanceData}
        />
    );
};
