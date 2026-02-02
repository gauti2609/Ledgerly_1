// components/schedules/OtherNonCurrentAssetsSchedule.tsx
import React from 'react';
import { GenericScheduleItem } from '../../types.ts';
import { GenericSchedule } from './GenericSchedule.tsx';

interface OtherNonCurrentAssetsScheduleProps {
    data: GenericScheduleItem[];
    onUpdate: (data: GenericScheduleItem[]) => void;
    isFinalized: boolean;
    trialBalanceData?: any[];
}

export const OtherNonCurrentAssetsSchedule: React.FC<OtherNonCurrentAssetsScheduleProps> = ({ data, onUpdate, isFinalized, trialBalanceData }) => {
    return (
        <GenericSchedule
            title="Other Non-Current Assets"
            data={data}
            onUpdate={onUpdate}
            isFinalized={isFinalized}
            trialBalanceData={trialBalanceData}
        />
    );
};
