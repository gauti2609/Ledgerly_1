import React from 'react';
import { AllData, LoansAndAdvancesScheduleData, ManualInput } from '../../../types.ts';
import { GenericNote } from './GenericNote.tsx';

interface LoansAndAdvancesNoteProps {
    data: LoansAndAdvancesScheduleData;
    allData: AllData;
    noteId: string;
}

const getValue = (val: string | ManualInput | undefined): string => {
    if (!val) return '';
    return typeof val === 'string' ? val : val.value;
};

const shouldShow = (val: string | ManualInput | undefined): boolean => {
    if (!val) return false;
    if (typeof val === 'string') return val.length > 0;
    return val.isSelected;
};

const formatCurrency = (val: string): string => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const LoansAndAdvancesNote: React.FC<LoansAndAdvancesNoteProps> = ({ data, allData, noteId }) => {
    return (
        <div className="space-y-4">
            <GenericNote title="" data={data.items} allData={allData} noteId={noteId} />
            {shouldShow(data.allowanceForBadAndDoubtful) && (
                <div>
                    <span className="font-semibold text-gray-400">Allowance for bad and doubtful loans and advances: </span>
                    <span className="font-mono">{formatCurrency(getValue(data.allowanceForBadAndDoubtful))}</span>
                </div>
            )}
        </div>
    );
};