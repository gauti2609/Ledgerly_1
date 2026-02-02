// components/schedules/LongTermReceivablesAgeingSchedule.tsx
import React from 'react';
import { TradeReceivablesData, TradeReceivablesAgeingRow } from '../../types.ts';
import { TradeReceivablesSchedule } from './TradeReceivablesSchedule.tsx';

interface LongTermReceivablesAgeingScheduleProps {
    data: TradeReceivablesAgeingRow[];
    onUpdate: (data: TradeReceivablesAgeingRow[]) => void;
    isFinalized: boolean;
}

export const LongTermReceivablesAgeingSchedule: React.FC<LongTermReceivablesAgeingScheduleProps> = ({ data, onUpdate, isFinalized }) => {
    
    // Create a mock structure for the parts of TradeReceivablesData we don't need here.
    const mockTradeRecData: TradeReceivablesData = {
        securedGood: '0', 
        unsecuredGood: '0', 
        doubtful: '0', 
        provisionForDoubtful: '0',
        ageing: data,
    };
    
    // Wrapper onUpdate to only pass back the ageing part
    const handleUpdate = (fullData: TradeReceivablesData) => {
        onUpdate(fullData.ageing);
    }
    
    return (
        <div className="space-y-6">
             {/* The title prop in TradeReceivablesSchedule will be rendered, so we can control it here */}
            <TradeReceivablesSchedule
                title="Long-Term Trade Receivables"
                data={mockTradeRecData}
                onUpdate={handleUpdate}
                isFinalized={isFinalized}
            />
        </div>
    );
};