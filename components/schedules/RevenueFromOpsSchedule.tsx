import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { GenericScheduleItem } from '../../types.ts';
import { GenericSchedule } from './GenericSchedule.tsx';

interface RevenueFromOpsScheduleProps {
    data: GenericScheduleItem[];
    // FIX: Changed onUpdate prop to be a callback with the specific data slice, making the component more modular and fixing type errors.
    onUpdate: (data: GenericScheduleItem[]) => void;
    isFinalized: boolean;
    trialBalanceData?: any[]; // Using any[] to avoid strict type import if not needed, or better Import TrialBalanceItem
}

export const RevenueFromOpsSchedule: React.FC<RevenueFromOpsScheduleProps> = ({ data, onUpdate, isFinalized, trialBalanceData }) => {

    // FIX: Removed the handleDataUpdate wrapper as it's no longer needed with the refactored onUpdate prop.
    return (
        <GenericSchedule
            title="Revenue from Operations"
            data={data}
            onUpdate={onUpdate}
            isFinalized={isFinalized}
            trialBalanceData={trialBalanceData}
        />
    );
};