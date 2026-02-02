

import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { EventsAfterBalanceSheetData, ScheduleData, ManualInput } from '../../../types.ts';
import { InputWithCheckbox } from '../../InputWithCheckbox.tsx';

interface EventsAfterBalanceSheetNoteProps {
    data: EventsAfterBalanceSheetData;
    onUpdate?: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized?: boolean;
}

// Helper functions for ManualInput
const getValue = (val: string | ManualInput | undefined): string => {
    if (!val) return '';
    return typeof val === 'string' ? val : val.value;
};

const shouldShow = (val: string | ManualInput | undefined): boolean => {
    if (!val) return false;
    if (typeof val === 'string') return val.length > 0;
    return val.isSelected;
};

export const EventsAfterBalanceSheetNote: React.FC<EventsAfterBalanceSheetNoteProps> = ({ data, onUpdate, isFinalized = false }) => {

    const handleUpdate = (value: ManualInput) => {
        if (onUpdate) {
            onUpdate(prev => ({ ...prev, eventsAfterBalanceSheet: { content: value } }));
        }
    };

    if (!onUpdate) {
        if (!shouldShow(data.content)) return null;
        return (
            <div className="space-y-3 text-sm">
                <p>{getValue(data.content)}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Events after Balance Sheet Date</h3>
            <p className="text-sm text-gray-400">Disclose any significant events, both adjusting and non-adjusting, that occurred between the balance sheet date and the date the financial statements were approved.</p>
            <InputWithCheckbox
                label="Details"
                value={data.content}
                onChange={handleUpdate}
                disabled={isFinalized}
                rows={5}
            />
        </div>
    );
};