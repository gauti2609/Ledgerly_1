// components/reports/notes/LongTermReceivablesAgeingNote.tsx
import React from 'react';
import { TradeReceivablesAgeingRow } from '../../../types.ts';
import { TradeReceivablesNote } from './TradeReceivablesAgeingNote.tsx';

interface LongTermReceivablesAgeingNoteProps {
    data: TradeReceivablesAgeingRow[];
}

export const LongTermReceivablesAgeingNote: React.FC<LongTermReceivablesAgeingNoteProps> = ({ data }) => {
    // Create a mock structure for the parts of TradeReceivablesData we don't need for the ageing table display
    const mockTradeRecData = {
        securedGood: '', 
        unsecuredGood: '', 
        doubtful: '', 
        provisionForDoubtful: '',
        ageing: data,
    };
    return (
        <div>
             <h4 className="font-semibold text-gray-300 mb-2">Ageing of Long-Term Trade Receivables</h4>
            {/* The TradeReceivablesNote will only render the ageing table if other fields are empty */}
            <TradeReceivablesNote data={mockTradeRecData} />
        </div>
    );
};