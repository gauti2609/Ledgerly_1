// components/schedules/OtherCurrentLiabilitiesSchedule.tsx
import React from 'react';
import { GenericScheduleItem } from '../../types.ts';
import { GenericSchedule } from './GenericSchedule.tsx';

interface OtherCurrentLiabilitiesScheduleProps {
    data: GenericScheduleItem[];
    onUpdate: (data: GenericScheduleItem[]) => void;
    isFinalized: boolean;
    trialBalanceData?: any[];
}

export const OtherCurrentLiabilitiesSchedule: React.FC<OtherCurrentLiabilitiesScheduleProps> = ({ data, onUpdate, isFinalized, trialBalanceData }) => {
    return (
        <GenericSchedule
            title="Other Current Liabilities"
            data={data}
            onUpdate={onUpdate}
            isFinalized={isFinalized}
            trialBalanceData={trialBalanceData}
        />
    );
};
